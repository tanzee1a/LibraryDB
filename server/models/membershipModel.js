const db = require('../config/db');

/**
 * Helper function to get a user's membership fee from their role
 */
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

/**
 * Creates a new membership and logs the first payment.
 * This runs in a transaction.
 */
async function create(userId, paymentDetails) {
    // 1. Get the membership fee
    const feeAmount = await getMembershipFee(userId);
    if (feeAmount <= 0) {
        throw new Error("This user role does not have a membership fee.");
    }

    // 2. Extract safe payment info (NEVER store full card number or CVV)
    const cardLastFour = paymentDetails.cardNumber.slice(-4);
    const cardExpDate = paymentDetails.expDate; // 'MM/YY'
    const billingAddress = paymentDetails.billingAddress;

    if (!cardLastFour || !cardExpDate || !billingAddress) {
        throw new Error("Missing required payment details.");
    }
    
    // 3. Start a transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 4. Log the payment
        const paymentSql = `
            INSERT INTO MEMBERSHIP_PAYMENT (user_id, amount, notes) 
            VALUES (?, ?, 'Initial Signup')
        `;
        await connection.query(paymentSql, [userId, feeAmount]);

        // 5. Create the membership record (expires in 1 month)
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
        // Using ON DUPLICATE KEY UPDATE handles the case where an 'EXPIRED' user re-signs up
        await connection.query(membershipSql, [userId, cardLastFour, cardExpDate, billingAddress]);

        // 6. Commit the transaction
        await connection.commit();
        
        return { message: 'Membership created successfully.' };

    } catch (error) {
        // 7. Rollback if anything fails
        await connection.rollback();
        console.error("Error creating membership:", error);
        throw error; // Re-throw error to be caught by controller
    } finally {
        connection.release();
    }
}

/**
 * Cancels a membership (turns off auto-renew)
 */
async function cancel(userId) {
    const sql = "UPDATE PATRON_MEMBERSHIP SET auto_renew = 0 WHERE user_id = ?";
    const [result] = await db.query(sql, [userId]);
    
    if (result.affectedRows === 0) {
        throw new Error("No active membership found to cancel.");
    }
    return { message: 'Membership canceled. It will remain active until the expiration date.' };
}

/**
 * Renews a membership.
 * - If 'canceled', it just turns auto-renew back on.
 * - If 'expired', it charges a new fee and sets a new expiration date.
 */
async function renew(userId) {
    // 1. Find their current membership record
    const [rows] = await db.query("SELECT * FROM PATRON_MEMBERSHIP WHERE user_id = ?", [userId]);
    
    if (rows.length === 0) {
        throw new Error("No membership record found. Please sign up first.");
    }

    const membership = rows[0];
    const isExpired = new Date(membership.expires_at) < new Date();

    // Case 1: Membership is 'expired'. Re-charge and start a new month.
    if (isExpired) {
        // 1a. Get the fee
        const feeAmount = await getMembershipFee(userId);
        
        // 1b. Start transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            // 1c. Log payment
            const paymentSql = `
                INSERT INTO MEMBERSHIP_PAYMENT (user_id, amount, notes) 
                VALUES (?, ?, 'Renewal')
            `;
            await connection.query(paymentSql, [userId, feeAmount]);

            // 1d. Update membership
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