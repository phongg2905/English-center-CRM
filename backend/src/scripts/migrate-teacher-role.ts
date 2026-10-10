import { query, pool } from '../database/pool.js';

async function migrate() {
  try {
    console.log('🔄 Đang cập nhật ràng buộc chk_role_code cho bảng roles...');
    await query('ALTER TABLE roles DROP CONSTRAINT IF EXISTS chk_role_code;');
    await query(`ALTER TABLE roles ADD CONSTRAINT chk_role_code CHECK (role_code IN ('ADMIN', 'SALES', 'ACADEMIC', 'TEACHER'));`);

    console.log('🔄 Đang chèn vai trò TEACHER...');
    await query(`
      INSERT INTO roles (role_code, role_name, description)
      VALUES ('TEACHER', 'Giảng viên', 'Giảng dạy các lớp học, chấm thi và quản lý học viên')
      ON CONFLICT (role_code) DO NOTHING;
    `);

    // Kiểm tra xem bảng users có cần thêm các trường chuyên môn cho teacher không
    console.log('🔄 Đang kiểm tra mở rộng bảng users cho giảng viên...');
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization VARCHAR(150);`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT FALSE;`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);

    const res = await query('SELECT * FROM roles ORDER BY id ASC;');
    console.log('✅ Danh sách vai trò sau khi cập nhật:');
    console.table(res.rows);
  } catch (error) {
    console.error('❌ Lỗi cập nhật CSDL:', error);
  } finally {
    await pool.end();
  }
}

migrate();
