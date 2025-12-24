import { pool } from "../db.js"

export const getAllUsers = async (req, res) => {
    let users = [];
    try {  
        // fetch students
        const [studentRows] = await pool.execute(`SELECT s.student_id AS id, s.email, s.name, s.phone, 'student' AS role FROM student s`);
        
        // fetch admins
        const [adminRows] = await pool.execute(`SELECT a.admin_id AS id, a.email, a.name, a.phone, 'admin' AS role FROM admin a`);

        users = [...studentRows, ...adminRows];

        return res.status(200).json(users);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Something went wrong", status: "error" });
    }
}

// fixed 14/12/25
export const getUnAllocatedUsers = async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT s.roll, s.email, s.name, s.phone FROM student s
            WHERE NOT EXISTS (
            SELECT 1 FROM allocations a
            WHERE a.student_id = s.student_id AND a.status = 'active'
        )`);

        if (rows.length === 0) {
            return res.status(404).json({ message: "No unallocated students found", status: "not_found" });
        }

        return res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong", status: "error" });
    }
}

// fixed 13/12/25
export const getAllocatedUsers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT name, roll, phone, block, room, email FROM student WHERE block IS NOT NULL");
        return res.status(200).json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong", status: "error" });
    }
}

export const getUser = (req, res) => {

    const u_id = req.userID
    const { role } = req.query

    const q = `SELECT * FROM ${role} WHERE id = ?`

    db.query(q, u_id, (err, data) => {
        if (err) return res.status(500).json({ message: "Something went wrong !", status: 'error' })

        if (data.length === 0) return res.status(404).json({ message: "User does not exist", status: 'error' })

        const { id, password, ...other } = data[0]

        return res.status(200).json({ dataSet: other, status: 'success' })
    })
}

// fixed 14/12/25
export const updateUser = async (req, res) => {
    try {
        const u_id = req.user_id;
        const role = req.user_role;
        const { field, contact } = req.body;

        // validate role to prevent SQL injection
        const allowedRoles = ['student', 'admin'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role', status: 'error' });
        }

        if (field === 'contact') {
            console.log("role->", role, "phone->", contact, "user->", u_id);
            const [result] = await pool.execute(`UPDATE ${role} SET phone = ? WHERE ${role}_id = ?`, [contact.trim(), u_id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'User not found', status: 'not_found' });
            }

            return res.status(200).json({ message: 'Profile successfully updated', status: 'success' });

        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong!', status: 'error' });
    }
}