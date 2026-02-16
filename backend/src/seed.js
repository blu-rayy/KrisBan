import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import Board from './src/models/Board.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Board.deleteMany({});

    console.log('Creating test users...');

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'password123', // Will be hashed automatically
      name: 'Admin User',
      role: 'ADMIN',
      isFirstLogin: false // Set to false so admin can login directly
    });

    console.log('✅ Admin created:', admin.email);

    // Create regular users
    const user1 = await User.create({
      email: 'user@example.com',
      password: 'password123',
      name: 'John Doe',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ User 1 created:', user1.email);

    const user2 = await User.create({
      email: 'alice@example.com',
      password: 'password123',
      name: 'Alice Smith',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ User 2 created:', user2.email);

    // Create sample boards
    console.log('Creating sample boards...');

    const board1 = await Board.create({
      title: 'Website Redesign',
      description: 'Redesigning the company website with modern UI',
      owner: admin._id,
      members: [user1._id, user2._id],
      columns: [
        {
          id: 'col-1',
          title: 'To Do',
          cards: [
            {
              id: 'card-1',
              title: 'Design mockups',
              description: 'Create Figma mockups for new design',
              priority: 'HIGH',
              assignee: user1._id
            },
            {
              id: 'card-2',
              title: 'Define color scheme',
              description: 'Choose primary and secondary colors',
              priority: 'MEDIUM',
              assignee: user2._id
            }
          ]
        },
        {
          id: 'col-2',
          title: 'In Progress',
          cards: [
            {
              id: 'card-3',
              title: 'Frontend implementation',
              description: 'Build React components',
              priority: 'HIGH',
              assignee: user1._id
            }
          ]
        },
        {
          id: 'col-3',
          title: 'Done',
          cards: [
            {
              id: 'card-4',
              title: 'Project planning',
              description: 'Created project timeline and goals',
              priority: 'MEDIUM'
            }
          ]
        }
      ]
    });

    console.log('✅ Board 1 created:', board1.title);

    const board2 = await Board.create({
      title: 'Mobile App Development',
      description: 'Building cross-platform mobile application',
      owner: user1._id,
      members: [admin._id, user2._id],
      columns: [
        {
          id: 'col-4',
          title: 'To Do',
          cards: [
            {
              id: 'card-5',
              title: 'Setup development environment',
              description: 'Configure React Native project',
              priority: 'HIGH'
            },
            {
              id: 'card-6',
              title: 'Create database schema',
              description: 'Design Firebase collections',
              priority: 'HIGH'
            }
          ]
        },
        {
          id: 'col-5',
          title: 'In Progress',
          cards: []
        },
        {
          id: 'col-6',
          title: 'Done',
          cards: []
        }
      ]
    });

    console.log('✅ Board 2 created:', board2.title);

    const board3 = await Board.create({
      title: 'API Documentation',
      description: 'Creating comprehensive API documentation',
      owner: user2._id,
      members: [admin._id, user1._id],
      columns: [
        {
          id: 'col-7',
          title: 'To Do',
          cards: [
            {
              id: 'card-7',
              title: 'Document auth endpoints',
              description: 'Write detailed docs for auth API',
              priority: 'MEDIUM',
              assignee: user1._id
            }
          ]
        },
        {
          id: 'col-8',
          title: 'In Progress',
          cards: [
            {
              id: 'card-8',
              title: 'Document dashboard endpoints',
              description: 'Write dashboard API documentation',
              priority: 'MEDIUM',
              assignee: user2._id
            }
          ]
        },
        {
          id: 'col-9',
          title: 'Done',
          cards: []
        }
      ]
    });

    console.log('✅ Board 3 created:', board3.title);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────');
    console.log('Admin:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    console.log('\nUser 1:');
    console.log('  Email: user@example.com');
    console.log('  Password: password123');
    console.log('\nUser 2:');
    console.log('  Email: alice@example.com');
    console.log('  Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
