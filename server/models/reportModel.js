// models/reportModel.js
const db = require('../config/db');

async function mostPopularItems() {
    let sql = `
        SELECT 
            i.item_id,
            i.thumbnail_url,
            COALESCE(bk.title, m.title, d.device_name) AS item_name,

            CASE 
                WHEN i.category = 'BOOK' THEN 
                    GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
                WHEN i.category = 'MOVIE' THEN 
                    GROUP_CONCAT(DISTINCT CONCAT(dr.first_name, ' ', dr.last_name) SEPARATOR ', ')
                WHEN i.category = 'DEVICE' THEN 
                    d.manufacturer
            END AS item_creator,

            COUNT(b.borrow_id) AS borrow_count
        FROM ITEM i
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id
        LEFT JOIN BOOK_AUTHOR ba ON bk.item_id = ba.item_id
        LEFT JOIN AUTHOR a ON ba.author_id = a.author_id

        LEFT JOIN MOVIE m ON i.item_id = m.item_id
        LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id
        LEFT JOIN DIRECTOR dr ON md.director_id = dr.director_id

        LEFT JOIN DEVICE d ON i.item_id = d.item_id

        LEFT JOIN BORROW b ON i.item_id = b.item_id

        GROUP BY i.item_id, i.thumbnail_url, item_name, i.category, d.manufacturer
        ORDER BY borrow_count DESC
        LIMIT 5
    `;

    const [rows] = await db.query(sql);
    return rows;
}

async function mostPopularGenres() {
    let sql = `
        SELECT 
            t.tag_name AS genre_name,
            COUNT(b.borrow_id) AS total_borrows
        FROM TAG t
        JOIN ITEM_TAG it ON t.tag_id = it.tag_id
        JOIN ITEM i ON it.item_id = i.item_id
        LEFT JOIN BORROW b ON i.item_id = b.item_id
        GROUP BY t.tag_name
        ORDER BY total_borrows DESC
        LIMIT 20;
    `;

    const [rows] = await db.query(sql);
    return rows;
}

async function similarItems({ item_id = null }) {
  if (!item_id) return [];

  const sqlInfo = `
    SELECT 
      i.category,
      GROUP_CONCAT(it.tag_id) AS tag_list
    FROM ITEM i
    LEFT JOIN ITEM_TAG it ON it.item_id = i.item_id
    WHERE i.item_id = ?
    GROUP BY i.item_id, i.category;
  `;

  const [infoRows] = await db.query(sqlInfo, [item_id]);
  if (infoRows.length === 0) return [];

  const category = infoRows[0].category;
  const tagListRaw = infoRows[0].tag_list;
  const tagIds = tagListRaw ? tagListRaw.split(',') : [];

  // If no tags, then fallback to most popular items in same category
  if (!tagIds.length) {
    const sqlFallback = `
      SELECT 
          i.item_id,
          i.thumbnail_url,
          COALESCE(bk.title, m.title, d.device_name) AS item_name,
          CASE 
              WHEN i.category = 'BOOK' THEN 
                  GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
              WHEN i.category = 'MOVIE' THEN 
                  GROUP_CONCAT(DISTINCT CONCAT(dr.first_name, ' ', dr.last_name) SEPARATOR ', ')
              WHEN i.category = 'DEVICE' THEN 
                  d.manufacturer
          END AS item_creator,
          COUNT(b.borrow_id) AS borrow_count
      FROM ITEM i
      LEFT JOIN BOOK bk ON i.item_id = bk.item_id
      LEFT JOIN BOOK_AUTHOR ba ON bk.item_id = ba.item_id
      LEFT JOIN AUTHOR a ON ba.author_id = a.author_id
      LEFT JOIN MOVIE m ON i.item_id = m.item_id
      LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id
      LEFT JOIN DIRECTOR dr ON md.director_id = dr.director_id
      LEFT JOIN DEVICE d ON i.item_id = d.item_id
      LEFT JOIN BORROW b ON i.item_id = b.item_id
      WHERE i.category = ?
        AND i.item_id <> ?
      GROUP BY i.item_id, i.thumbnail_url, item_name, i.category, d.manufacturer
      ORDER BY borrow_count DESC
      LIMIT 10;
    `;

    const [fallback] = await db.query(sqlFallback, [category, item_id]);
    return fallback;
  }

  // Step 2: Items that match ANY tag of the input item
  const placeholders = tagIds.map(() => '?').join(',');
  const sqlByTags = `
    SELECT 
        i.item_id,
        i.thumbnail_url,
        COALESCE(bk.title, m.title, d.device_name) AS item_name,
        CASE 
            WHEN i.category = 'BOOK' THEN 
                GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
            WHEN i.category = 'MOVIE' THEN 
                GROUP_CONCAT(DISTINCT CONCAT(dr.first_name, ' ', dr.last_name) SEPARATOR ', ')
            WHEN i.category = 'DEVICE' THEN 
                d.manufacturer
        END AS item_creator,
        COUNT(DISTINCT it.tag_id) AS shared_tags
    FROM ITEM_TAG it
    JOIN ITEM i ON i.item_id = it.item_id
    LEFT JOIN BOOK bk ON i.item_id = bk.item_id
    LEFT JOIN BOOK_AUTHOR ba ON bk.item_id = ba.item_id
    LEFT JOIN AUTHOR a ON ba.author_id = a.author_id
    LEFT JOIN MOVIE m ON i.item_id = m.item_id
    LEFT JOIN MOVIE_DIRECTOR md ON m.item_id = md.item_id
    LEFT JOIN DIRECTOR dr ON md.director_id = dr.director_id
    LEFT JOIN DEVICE d ON i.item_id = d.item_id
    WHERE it.tag_id IN (${placeholders})
      AND i.item_id <> ?
    GROUP BY i.item_id, i.thumbnail_url, item_name, i.category, d.manufacturer
    ORDER BY shared_tags DESC
    LIMIT 10;
  `;

  const params = [...tagIds, item_id];
  const [rows] = await db.query(sqlByTags, params);

  return rows;
}

async function popularGenresReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    let sql = `
        SELECT 
            t.tag_name AS genre_name,
            COUNT(b.borrow_id) AS total_borrows
        FROM TAG t
        JOIN ITEM_TAG it ON t.tag_id = it.tag_id
        JOIN ITEM i ON it.item_id = i.item_id
        LEFT JOIN BORROW b ON i.item_id = b.item_id
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }


    sql += `
        GROUP BY t.tag_name
        ORDER BY total_borrows DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function popularItemReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    let sql = `
        SELECT 
            i.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_name,
            i.quantity,
            COUNT(DISTINCT b.borrow_id) AS borrow_count,
            COUNT(DISTINCT w.user_id) AS wishlist_count
        FROM ITEM i
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        LEFT JOIN BORROW b ON i.item_id = b.item_id
        LEFT JOIN WISHLIST w ON i.item_id = w.item_id
        WHERE 1=1
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }

    sql += `
        GROUP BY i.item_id, i.category, item_name, i.quantity
        ORDER BY borrow_count DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function overdueItemsReport({ filterType = 'date', start = null, end = null, category = null } = {}) {
    const loanedOutStatusId = 2; // Assuming 2 = 'Loaned Out' from BORROW_STATUS
    let sql = `
        SELECT 
            b.borrow_id,
            b.item_id,
            i.category,
            COALESCE(bk.title, m.title, d.device_name) AS item_title,
            u.email,
            u.firstName,
            u.lastName,
            b.borrow_date,
            b.due_date,
            DATEDIFF(CURDATE(), b.due_date) AS days_overdue -- Calculate days overdue
        FROM BORROW b
        JOIN USER u ON b.user_id = u.user_id
        JOIN ITEM i ON b.item_id = i.item_id
        JOIN BORROW_STATUS bs ON b.status_id = bs.status_id
        LEFT JOIN BOOK bk ON i.item_id = bk.item_id AND i.category = 'BOOK'
        LEFT JOIN MOVIE m ON i.item_id = m.item_id AND i.category = 'MOVIE'
        LEFT JOIN DEVICE d ON i.item_id = d.item_id AND i.category = 'DEVICE'
        WHERE 
            b.status_id = ? -- Must be 'Loaned Out'
            AND b.due_date < CURDATE() -- Due date must be in the past
    `;

    const params = [loanedOutStatusId];


    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (category) {
        sql += ' AND i.category = ?';
        params.push(category);
    }

    sql += `
        ORDER BY days_overdue DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function finesReport({ filterType = 'date', start = null, end = null, paid_status = null, fee_type = null } = {}) {
    let sql = `
        SELECT 
            f.fee_type,
            f.fine_id,
            u.email,
            u.firstName,
            u.lastName,
            f.amount AS amount_due,
            f.date_issued,
            f.date_paid,
            f.notes
        FROM FINE f
        JOIN USER u ON f.user_id = u.user_id
        WHERE 
            1=1
    `;

    const params = [];

    if (paid_status === '0') {
        sql += ' AND f.date_paid IS NULL AND f.waived_at IS NULL';
    }
    if (paid_status === '1') {
        sql += ' AND f.date_paid IS NOT NULL';
    }

    if (fee_type !== null && fee_type !== '') {
        sql += ' AND f.fee_type = ?';
        params.push(fee_type);
    }

    if (filterType === 'date') {
        if (start && end) sql += ' AND f.date_issued BETWEEN ? AND ?';
        else if (start) sql += ' AND f.date_issued >= ?';
        else if (end) sql += ' AND f.date_issued <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(f.date_issued, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(f.date_issued, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(f.date_issued, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(f.date_issued) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(f.date_issued) >= ?';
        else if (end) sql += ' AND YEAR(f.date_issued) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    sql += ` ORDER BY f.date_issued DESC; `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function activeUsersReport({ filterType = 'date', start = null, end = null, role = null, minBorrow = null, maxBorrow = null } = {}) {
    let sql = `
        SELECT 
            u.email,
            u.firstName,
            u.lastName,
            r.role_name,
            COUNT(b.borrow_id) AS total_borrows
        FROM USER u
        LEFT JOIN BORROW b ON u.user_id = b.user_id
        JOIN USER_ROLE r ON u.role_id = r.role_id
        WHERE 1=1
        AND u.role_id != 4
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND b.borrow_date BETWEEN ? AND ?';
        else if (start) sql += ' AND b.borrow_date >= ?';
        else if (end) sql += ' AND b.borrow_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(b.borrow_date, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(b.borrow_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(b.borrow_date) >= ?';
        else if (end) sql += ' AND YEAR(b.borrow_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (role) {
        sql += ' AND u.role_id = ?';
        params.push(role);
    }

    sql += `
        GROUP BY u.user_id, u.email, u.firstName, u.lastName, r.role_name
    `;

    if (minBorrow || maxBorrow) {
        sql += ` HAVING 1=1`;

        if (minBorrow) {
            sql += ` AND COUNT(b.borrow_id) >= ?`;
            params.push(minBorrow);
        }
        if (maxBorrow) {
            sql += ` AND COUNT(b.borrow_id) <= ?`;
            params.push(maxBorrow);
        }
    }

    sql += `
        ORDER BY total_borrows DESC;
    `;

    const [rows] = await db.query(sql, params);
    return rows;
}

async function membershipReport({ filterType = 'date', start = null, end = null, status = null } = {}) {
    let sql = `
        SELECT
            u.email,
            u.firstName,
            u.lastName,
            CASE
                WHEN r.requires_membership_fee = 0 THEN NULL
                WHEN pm.user_id IS NULL THEN 'Not Enrolled'
                WHEN pm.expires_at < NOW() THEN 'Expired'
                WHEN pm.auto_renew = 0 THEN 'Canceled'
                ELSE 'Active'
            END AS membership_status,
            pm.auto_renew,
            pm.signup_date,
            pm.expires_at AS expires_on
        FROM USER u
        JOIN USER_ROLE r ON u.role_id = r.role_id
        LEFT JOIN PATRON_MEMBERSHIP pm ON u.user_id = pm.user_id
        WHERE r.requires_membership_fee = 1
    `;

    const params = [];

    if (filterType === 'date') {
        if (start && end) sql += ' AND pm.signup_date BETWEEN ? AND ?';
        else if (start) sql += ' AND pm.signup_date >= ?';
        else if (end) sql += ' AND pm.signup_date <= ?';
    } 
    else if (filterType === 'month') {
        if (start && end) sql += " AND DATE_FORMAT(pm.signup_date, '%Y-%m') BETWEEN ? AND ?";
        else if (start) sql += " AND DATE_FORMAT(pm.signup_date, '%Y-%m') >= ?";
        else if (end) sql += " AND DATE_FORMAT(pm.signup_date, '%Y-%m') <= ?";
    } 
    else if (filterType === 'year') {
        if (start && end) sql += ' AND YEAR(pm.signup_date) BETWEEN ? AND ?';
        else if (start) sql += ' AND YEAR(pm.signup_date) >= ?';
        else if (end) sql += ' AND YEAR(pm.signup_date) <= ?';
    }

    if (start && end) params.push(start, end);
    else if (start) params.push(start);
    else if (end) params.push(end);

    if (status) {
        sql += `
            AND (
                CASE
                    WHEN r.requires_membership_fee = 0 THEN NULL
                    WHEN pm.user_id IS NULL THEN 'Not Enrolled'
                    WHEN pm.expires_at < NOW() THEN 'Expired'
                    WHEN pm.auto_renew = 0 THEN 'Canceled'
                    ELSE 'Active'
                END
            ) = ?
        `;
        params.push(status);
    }

    sql += `
        ORDER BY pm.signup_date DESC;
    `;

    const [rows] = await db.query(sql, params);

    // Format expires_at as MM/DD/YYYY
    const formattedRows = rows.map(row => ({
    ...row,
    expires_on: row.expires_on
        ? new Date(row.expires_on).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        : null,
    signup_date: row.signup_date
        ? new Date(row.signup_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        : null
    }));

    return formattedRows;
}

async function revenueReport({ filterType = 'date', start = null, end = null, type = null } = {}) {
    const selects = [];
    const params = [];

    const addDateFilters = (prefix) => {
        let clause = '';

        if (filterType === 'date') {
            if (start && end) clause += ` AND ${prefix} BETWEEN ? AND ?`;
            else if (start) clause += ` AND ${prefix} >= ?`;
            else if (end) clause += ` AND ${prefix} <= ?`;
        } else if (filterType === 'month') {
            if (start && end) clause += ` AND DATE_FORMAT(${prefix}, '%Y-%m') BETWEEN ? AND ?`;
            else if (start) clause += ` AND DATE_FORMAT(${prefix}, '%Y-%m') >= ?`;
            else if (end) clause += ` AND DATE_FORMAT(${prefix}, '%Y-%m') <= ?`;
        } else if (filterType === 'year') {
            if (start && end) clause += ` AND YEAR(${prefix}) BETWEEN ? AND ?`;
            else if (start) clause += ` AND YEAR(${prefix}) >= ?`;
            else if (end) clause += ` AND YEAR(${prefix}) <= ?`;
        }

        if (start && end) {
            params.push(start, end);
        } else if (start) {
            params.push(start);
        } else if (end) {
            params.push(end);
        }

        return clause;
    };

    if (!type || type === 'Fine') {
        let fineSql = `
            SELECT 'Fine' AS type, u.email AS user_email, f.amount, f.date_paid
            FROM FINE f
            JOIN USER u ON f.user_id = u.user_id
            WHERE f.date_paid IS NOT NULL
        `;
        fineSql += addDateFilters('f.date_paid');
        selects.push(fineSql);
    }
    if (!type || type === 'Membership') {
        let membershipSql = `
            SELECT 'Membership' AS type, u.email AS user_email, m.amount, m.payment_date AS date_paid
            FROM MEMBERSHIP_PAYMENT m
            JOIN USER u ON m.user_id = u.user_id
            WHERE m.payment_date IS NOT NULL
        `;
        membershipSql += addDateFilters('m.payment_date');
        selects.push(membershipSql);
    }

    const sql = selects.join(' UNION ALL ');

    const [rows] = await db.query(sql, params);
    return rows;
}

module.exports = {
    mostPopularItems,
    mostPopularGenres,
    similarItems,
    popularGenresReport,
    popularItemReport,
    overdueItemsReport,
    finesReport,
    activeUsersReport,
    membershipReport,
    revenueReport
};