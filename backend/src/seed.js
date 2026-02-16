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
      studentNumber: '202311645',
      password: 'password123',
      fullName: 'Kristian David Rogando Bautista',
      username: 'Kristian',
      instituteEmail: 'krbautista@fit.edu.ph',
      personalEmail: 'kristiandavidbautista@gmail.com',
      birthday: '2005-03-18',
      role: 'ADMIN',
      isFirstLogin: false
    });

    console.log('✅ Kristian (Admin) created:', kristian.studentNumber);

    // Create Angel
    const angel = await User.create({
      studentNumber: '202311538',
      password: 'password123',
      fullName: 'Angel Abliter Letada',
      username: 'Angel',
      instituteEmail: 'aaetada@fit.edu.ph',
      personalEmail: 'angel.letada1205@gmail.com',
      birthday: '2005-12-12',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ Angel created:', angel.studentNumber);

    // Create Michael
    const michael = await User.create({
      studentNumber: '202312132',
      password: 'password123',
      fullName: 'Michael Kevin Dimla Pascual',
      username: 'Michael',
      instituteEmail: 'mdpascual1@fit.edu.ph',
      personalEmail: 'michaelkevinpascual47@gmail.com',
      birthday: '2005-05-19',
      role: 'USER',
      isFirstLogin: false
    });

    console.log('✅ Michael created:', michael.studentNumber);

    // Create Marianne
    const marianne = await User.create({
      studentNumber: '202311273',
      password: 'password123',
      fullName: 'Marianne Angelika B. Santos',
      username: 'Marianne',
      instituteEmail: 'mbsantos@fit.edu.ph',
      personalEmail: 'mariannesantos174@gmail.com',
      birthday: '2004-07-01',
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
    console.log('\nTest Credentials:');
    console.log('─────────────────');
    console.log('Admin (Kristian):');
    console.log('  Student #: 202311645');
    console.log('  Password: password123');
    console.log('\nUser (Angel):');
    console.log('  Student #: 202311538');
    console.log('  Password: password123');
    console.log('\nUser (Michael):');
    console.log('  Student #: 202312132');
    console.log('  Password: password123');
    console.log('\nUser (Marianne):');
    console.log('  Student #: 202311273');
    console.log('  Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
