
import db from "@/lib/db";
import bcrypt from "bcryptjs";


// Pre-hashed bcrypt password: "P@ssw0rd"
const hashedPassword = '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/$2b$10$A5bTLoITqjrLmVEVAhMtu.GYF8ZIYC8ezCjhOOfq.iF8go1ETriQq';

const permissions: { name: string; description: string }[] = [
    { name: 'users:read', description: 'View users and their details' },
    { name: 'users:create', description: 'Create new users' },
    { name: 'users:update', description: 'Update existing users' },
    { name: 'users:delete', description: 'Delete users from the system' },
    { name: 'roles:read', description: 'View roles and their details' },
    { name: 'roles:create', description: 'Create new roles' },
    { name: 'roles:update', description: 'Update existing roles' },
    { name: 'roles:delete', description: 'Delete roles from the system' },
    { name: 'permissions:read', description: 'View permissions and their details' },
    { name: 'permissions:create', description: 'Create new permissions' },
    { name: 'permissions:update', description: 'Update existing permissions' },
    { name: 'permissions:delete', description: 'Delete permissions from the system' },
    { name: 'permissions:assign', description: 'Assign permissions to roles' },
    { name: 'profile:read', description: 'View own profile' },
    { name: 'profile:update', description: 'Update own profile' },
    { name: 'system:settings', description: 'Manage system settings' },
    { name: 'system:logs', description: 'View system logs' },
    { name: 'system:backup', description: 'Backup and restore system data' },
];

const roles: { name: string, description: string }[] = [
    { name: 'superAdmin', description: 'Full system access with all permissions' },
    { name: 'Manager', description: 'Department manager with user management capabilities' },
    { name: 'User', description: 'Standard user with limited access' },
    { name: 'Guest', description: 'Minimal access for demonstration purposes' },
];

const rolePermissions: Record<string, string[]> = {
    superAdmin: permissions.map((p) => p.name),
    Manager: [
        'users:read', 'users:create', 'users:update',
        'roles:read', 'permissions:read',
        'profile:read', 'profile:update',
    ],
    User: ['profile:read', 'profile:update'],
    Guest: ['profile:read'],
}

const users = [
    { email: 'superAdmin@example.com', name: 'superAdmin User', roles: ['superAdmin'], bio: 'Welcome to the user management system!' },
    { email: 'manager@example.com', name: 'Manager User', roles: ['Manager'], bio: 'Department manager responsible for user management and oversight.' },
    { email: 'user@example.com', name: 'Regular User', roles: ['User'], bio: 'Regular user bio' },
    { email: 'guest@example.com', name: 'Guest User', roles: ['Guest'], bio: 'Guest bio' },
    { email: 'multi@example.com', name: 'Multi-Role User', roles: ['Manager', 'User'], bio: 'Multi-role user bio', },
];

const settings = [
    { key: 'session_timeout', value: '60', category: 'security', type: 'number', description: 'Automatically log out users after this many minutes of inactivity', isPublic: false },
    { key: 'max_login_attempts', value: '5', category: 'security', type: 'number', description: 'Maximum number of failed login attempts before account lockout', isPublic: false },
    { key: 'app_description', value: 'A robust and scalable User Management System with RBAC2', category: 'general', type: 'textarea', description: 'A brief description of your application', isPublic: false },
    { key: 'smtp_password', value: 'SMTP Password', category: 'email', type: 'password', description: 'SMTP authentication password', isPublic: false },
    { key: 'smtp_port', value: '587', category: 'email', type: 'number', description: 'SMTP server port', isPublic: false },
    { key: 'notify_password_reset', value: 'true', category: 'notifications', type: 'boolean', description: 'Send email notifications for password resets', isPublic: false },
    { key: 'notify_admin_new_user', value: 'true', category: 'notifications', type: 'boolean', description: 'Send email to admins when new users register', isPublic: false },
    { key: 'enable_email_notifications', value: 'true', category: 'notifications', type: 'boolean', description: 'Send email notifications for important events', isPublic: false },
    { key: 'theme_primary_color', value: '#3b82f6', category: 'appearance', type: 'string', description: 'Primary theme color (hex code)', isPublic: false },
    { key: 'enable_dark_mode', value: 'true', category: 'appearance', type: 'boolean', description: 'Allow users to switch to dark mode', isPublic: false },
    { key: 'smtp_username', value: 'SMTP Username', category: 'email', type: 'string', description: 'SMTP authentication username', isPublic: false },
    { key: 'smtp_host', value: 'smtpHost', category: 'email', type: 'string', description: 'SMTP server hostname', isPublic: false },
    { key: 'smtp_from_name', value: 'From Name', category: 'email', type: 'string', description: 'Default sender name', isPublic: false },
    { key: 'smtp_from_email', value: 'melaku.girma.fr@gmail.com', category: 'email', type: 'string', description: 'Default sender email address', isPublic: false },
    { key: 'theme_secondary_color', value: '#64748b', category: 'appearance', type: 'string', description: 'Secondary theme color (hex code)', isPublic: false },
    { key: 'default_theme', value: 'light', category: 'appearance', type: 'select', description: 'Default theme for new users', isPublic: false },
    { key: 'default_user_role', value: 'User', category: 'users', type: 'string', description: 'Default role assigned to new users', isPublic: false },
    { key: 'max_users', value: '12', category: 'users', type: 'number', description: 'Maximum number of users allowed (0 for unlimited)', isPublic: false },
    { key: 'allow_registration', value: 'true', category: 'users', type: 'boolean', description: 'Allow new users to register accounts', isPublic: false },
    { key: 'require_email_verification', value: 'true', category: 'users', type: 'boolean', description: 'Require users to verify their email address', isPublic: false },
    { key: 'app_name', value: 'User Management System2', category: 'general', type: 'string', description: 'The name of your application', isPublic: false },
    { key: 'app_logo_url', value: '', category: 'general', type: 'string', description: 'URL to your application logo', isPublic: false },
    { key: 'maintenance_mode', value: 'false', category: 'general', type: 'boolean', description: 'Enable maintenance mode to prevent user access', isPublic: false },
    { key: 'password_require_symbols', value: 'true', category: 'security', type: 'boolean', description: 'Require at least one special character in passwords', isPublic: false },
    { key: 'password_min_length', value: '6', category: 'security', type: 'number', description: 'Minimum number of characters required for passwords', isPublic: false },
    { key: 'password_require_numbers', value: 'true', category: 'security', type: 'boolean', description: 'Require at least one number in passwords', isPublic: false },
    { key: 'password_require_uppercase', value: 'true', category: 'security', type: 'boolean', description: 'Require at least one uppercase letter in passwords', isPublic: false }
];

async function main() {
    console.log('🌱 Starting db seed...');

    //1. seed permissions
    for (const { name, description } of permissions) {
        await db.permission.upsert({
            where: { name },
            update: {},
            create: { name, description },
        });
    }

    //2, seed roles
    const createdRoles: Record<string, string> = {};
    for (const { name, description } of roles) {
        const role = await db.role.upsert({
            where: { name },
            update: {},
            create: { name, description },
        })
        createdRoles[name] = role.id;
    }

    //3. Assign permissions to roles
    for (const [roleName, permList] of Object.entries(rolePermissions)) {
        const roleId = createdRoles[roleName];

        for (const permName of permList) {
            const permission = await db.permission.findUnique({ where: { name: permName } });

            if (!permission) continue;

            await db.rolePermission.upsert({
                where: {
                    roleId_permissionId: {
                        roleId,
                        permissionId: permission.id
                    }
                },
                update: {},
                create: {
                    roleId,
                    permissionId: permission.id
                }
            })

        }
    }

    //4. seed users with roles
    for (const { email, name, roles: userRoles, bio } of users) {
        let user = await db.user.findUnique({ where: { email } });

        if (!user) {
            user = await db.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    bio,
                },
            });
        }

        for (const roleName of userRoles) {
            const roleId = createdRoles[roleName];
            await db.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: user.id,
                        roleId,
                    },
                },
                update: {},
                create: {
                    userId: user.id,
                    roleId,
                },
            });
        }
    }

    //5. seed settings
    for (const { key, value, category, type, description, isPublic } of settings) {
        await db.setting.upsert({
            where: { key },
            update: {},
            create: { key, value, category, type, description, isPublic },
        });
    }
    
    console.log('✅ db seed completed successfully.');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed', e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
