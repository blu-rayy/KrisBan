import dotenv from 'dotenv';
import connectDB, { supabase } from './config/database.js';
import User from './models/User.js';
import Board from './models/Board.js';

dotenv.config();

// ⛔ Safety guard — never run seed scripts against production
const supabaseUrl = process.env.SUPABASE_URL || '';
if (supabaseUrl.includes('supabase.co')) {
  console.error('\n⛔  BLOCKED: Seed scripts cannot run against the production Supabase database.');
  console.error('    Set SUPABASE_URL to a local instance (e.g. http://localhost:54321) and retry.\n');
  process.exit(1);
}

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Board.deleteMany({});

    // Clear teams (delete all)
    await supabase.from('teams').delete().neq('id', 0);

    console.log('Creating teams...');

    const { data: aPrioriTeam, error: t1Error } = await supabase
      .from('teams')
      .insert([{ name: 'A Priori' }])
      .select()
      .single();
    if (t1Error) throw t1Error;
    console.log('✅ Team "A Priori" created (id:', aPrioriTeam.id, ')');

    const { data: legacyPlusPlusTeam, error: t2Error } = await supabase
      .from('teams')
      .insert([{ name: 'Legacy++' }])
      .select()
      .single();
    if (t2Error) throw t2Error;
    console.log('✅ Team "Legacy++" created (id:', legacyPlusPlusTeam.id, ')');

    console.log('Creating users...');

    // Create Kristian (Admin — A Priori)
    const kristian = await User.create({
      studentNumber: '202300001',
      password: 'password123',
      fullName: 'Admin User',
      username: 'AdminUser',
      instituteEmail: 'admin.user@example.edu',
      personalEmail: 'admin.user@example.com',
      birthday: '2000-01-01',
      role: 'ADMIN',
      isFirstLogin: false,
      teamId: aPrioriTeam.id
    });

    console.log('✅ Kristian (Admin, A Priori) created:', kristian.studentNumber);

    // Create Angel (A Priori)
    const angel = await User.create({
      studentNumber: '202300002',
      password: 'password123',
      fullName: 'Team Member One',
      username: 'MemberOne',
      instituteEmail: 'member.one@example.edu',
      personalEmail: 'member.one@example.com',
      birthday: '2000-01-02',
      role: 'USER',
      isFirstLogin: false,
      teamId: aPrioriTeam.id
    });

    console.log('✅ Angel (A Priori) created:', angel.studentNumber);

    // Create Michael (A Priori)
    const michael = await User.create({
      studentNumber: '202300003',
      password: 'password123',
      fullName: 'Team Member Two',
      username: 'MemberTwo',
      instituteEmail: 'member.two@example.edu',
      personalEmail: 'member.two@example.com',
      birthday: '2000-01-03',
      role: 'USER',
      isFirstLogin: false,
      teamId: aPrioriTeam.id
    });

    console.log('✅ Michael (A Priori) created:', michael.studentNumber);

    // Create Marianne (A Priori)
    const marianne = await User.create({
      studentNumber: '202300004',
      password: 'password123',
      fullName: 'Team Member Three',
      username: 'MemberThree',
      instituteEmail: 'member.three@example.edu',
      personalEmail: 'member.three@example.com',
      birthday: '2000-01-04',
      role: 'USER',
      isFirstLogin: false,
      teamId: aPrioriTeam.id
    });

    console.log('✅ Marianne (A Priori) created:', marianne.studentNumber);

    // Create Jay (Admin — Legacy++)
    const jay = await User.create({
      studentNumber: '202311436',
      password: 'password123',
      fullName: 'John Janiel S. Obmerga',
      username: 'Jay',
      instituteEmail: 'jsobmerga@fit.edu.ph',
      personalEmail: 'obmergajohnjaniel@gmail.com',
      birthday: '2000-01-05',
      role: 'ADMIN',
      isFirstLogin: true,
      teamId: legacyPlusPlusTeam.id
    });

    console.log('✅ Jay (Admin, Legacy++) created:', jay.studentNumber);

    // Create sample boards for A Priori team
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
    console.log('\nTeams:');
    console.log('  • A Priori (id:', aPrioriTeam.id, ') — Kristian (ADMIN), Angel, Michael, Marianne');
    console.log('  • Legacy++ (id:', legacyPlusPlusTeam.id, ') — Jay (ADMIN)');
    console.log('\nTest credentials created using non-production placeholder identities.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
