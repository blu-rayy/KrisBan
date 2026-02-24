import dotenv from 'dotenv';
import connectDB from './config/database.js';
import User from './models/User.js';
import Board from './models/Board.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Board.deleteMany({});

    console.log('Creating test users...');

    // Create Kristian (Admin)
    const kristian = await User.create({
      studentNumber: '202300001',
      password: 'password123',
      fullName: 'Admin User',
      username: 'AdminUser',
      instituteEmail: 'admin.user@example.edu',
      personalEmail: 'admin.user@example.com',
      birthday: '2000-01-01',
      role: 'ADMIN',
      isFirstLogin: false
    });

    console.log('✅ Kristian (Admin) created:', kristian.studentNumber);

    // Create Angel
    const angel = await User.create({
      studentNumber: '202300002',
      password: 'password123',
      fullName: 'Team Member One',
      username: 'MemberOne',
      instituteEmail: 'member.one@example.edu',
      personalEmail: 'member.one@example.com',
      birthday: '2000-01-02',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ Angel created:', angel.studentNumber);

    // Create Michael
    const michael = await User.create({
      studentNumber: '202300003',
      password: 'password123',
      fullName: 'Team Member Two',
      username: 'MemberTwo',
      instituteEmail: 'member.two@example.edu',
      personalEmail: 'member.two@example.com',
      birthday: '2000-01-03',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ Michael created:', michael.studentNumber);

    // Create Marianne
    const marianne = await User.create({
      studentNumber: '202300004',
      password: 'password123',
      fullName: 'Team Member Three',
      username: 'MemberThree',
      instituteEmail: 'member.three@example.edu',
      personalEmail: 'member.three@example.com',
      birthday: '2000-01-04',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ Marianne created:', marianne.studentNumber);

    // Create sample boards
    console.log('Creating sample boards...');

    const board1 = await Board.create({
      title: 'Website Redesign',
      description: 'Redesigning the company website with modern UI',
      owner: kristian.id,
      members: [angel.id, michael.id],
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
              assignee: angel.id
            },
            {
              id: 'card-2',
              title: 'Define color scheme',
              description: 'Choose primary and secondary colors',
              priority: 'MEDIUM',
              assignee: michael.id
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
              assignee: angel.id
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
      owner: angel.id,
      members: [kristian.id, michael.id],
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
      owner: michael.id,
      members: [kristian.id, angel.id],
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
              assignee: angel.id
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
              assignee: michael.id
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
    console.log('\nTest credentials created using non-production placeholder identities.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
