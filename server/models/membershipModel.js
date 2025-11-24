const db = require('../config/db');

async function getMembershipFee(userId) {
    const feeSql = `
        SELECT r.membership_fee 
        FROM USER u 
        JOIN USER_ROLE r ON u.role_id = r.role_id 
        WHERE u.user_id = ?
    `;
    const [feeRows] = await db.query(feeSql, [userId]);
    if (feeRows.length === 0) {
        throw new Error("User not found");
    }
    return feeRows[0].membership_fee;
}

async function create(userId, paymentDetails) {
    const feeAmount = await getMembershipFee(userId);
    if (feeAmount <= 0) {
        throw new Error("This user role does not have a membership fee.");
    }

    const cardLastFour = paymentDetails.cardNumber.slice(-4);
    const cardExpDate = paymentDetails.expDate; // 'MM/YY'
    const billingAddress = paymentDetails.billingAddress;

    if (!cardLastFour || !cardExpDate || !billingAddress) {
        throw new Error("Missing required payment details.");
    }
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        const paymentSql = `
            INSERT INTO MEMBERSHIP_PAYMENT (user_id, amount, notes) 
            VALUES (?, ?, 'Initial Signup')
        `;
        await connection.query(paymentSql, [userId, feeAmount]);

        const membershipSql = `
            INSERT INTO PATRON_MEMBERSHIP 
                (user_id, membership_status, auto_renew, card_last_four, card_exp_date, billing_address, expires_at)
            VALUES 
                (?, 'ACTIVE', 1, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 MONTH))
            ON DUPLICATE KEY UPDATE
                membership_status = 'ACTIVE',
                auto_renew = 1,
                card_last_four = VALUES(card_last_four),
                card_exp_date = VALUES(card_exp_date),
                billing_address = VALUES(billing_address),
                expires_at = DATE_ADD(NOW(), INTERVAL 1 MONTH);
        `;
        await connection.query(membershipSql, [userId, cardLastFour, cardExpDate, billingAddress]);

        await connection.commit();
        
        return { message: 'Membership created successfully.' };

    } catch (error) {
        await connection.rollback();
        console.error("Error creating membership:", error);
        throw error;
    } finally {
        connection.release();
    }
}


async function cancel(userId) {
    const sql = "UPDATE PATRON_MEMBERSHIP SET auto_renew = 0 WHERE user_id = ?";
    const [result] = await db.query(sql, [userId]);
    
    if (result.affectedRows === 0) {
        throw new Error("No active membership found to cancel.");
    }
    return { message: 'Membership canceled. It will remain active until the expiration date.' };
}

async function renew(userId) {
    const [rows] = await db.query("SELECT * FROM PATRON_MEMBERSHIP WHERE user_id = ?", [userId]);
    
    if (rows.length === 0) {
        throw new Error("No membership record found. Please sign up first.");
    }

    const membership = rows[0];
    const isExpired = new Date(membership.expires_at) < new Date();

    // Case 1: Membership is 'expired'. Re-charge and start a new month.
    if (isExpired) {
        const feeAmount = await getMembershipFee(userId);

        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const paymentSql = `
                INSERT INTO MEMBERSHIP_PAYMENT (user_id, amount, notes) 
                VALUES (?, ?, 'Renewal')
            `;
            await connection.query(paymentSql, [userId, feeAmount]);

            const renewSql = `
                UPDATE PATRON_MEMBERSHIP
                SET membership_status = 'ACTIVE', auto_renew = 1, expires_at = DATE_ADD(NOW(), INTERVAL 1 MONTH)
                WHERE user_id = ?
            `;
            await connection.query(renewSql, [userId]);

            await connection.commit();
            return { message: 'Membership renewed successfully.' };
        } catch (error) {
            await connection.rollback();
            console.error("Error renewing membership:", error);
            throw error;
        } finally {
            connection.release();
        }
    }
    // Case 2: Membership is 'canceled' but not yet expired. Just turn auto-renew back on.
    else {
        const sql = "UPDATE PATRON_MEMBERSHIP SET auto_renew = 1 WHERE user_id = ?";
        await db.query(sql, [userId]);
        return { message: 'Membership auto-renewal has been re-enabled.' };
    }
}


module.exports = {
    create,
    cancel,
    renew
};