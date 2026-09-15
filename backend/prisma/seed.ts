import { PrismaClient, UserRole, ElectionStatus, ElectionType, CandidateStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.securityEvent.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.resultsCache.deleteMany();
  await prisma.ballotChoice.deleteMany();
  await prisma.ballot.deleteMany();
  await prisma.electionVoterEligibility.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.electionPosition.deleteMany();
  await prisma.election.deleteMany();
  await prisma.voterProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 12);

  // Create users
  const voter = await prisma.user.create({
    data: {
      email: 'voter@test.com',
      passwordHash,
      role: UserRole.voter,
      isActive: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          studentId: 'STU-2024-0892',
          fullName: 'Alex Johnson',
          department: 'Computer Science',
          yearOfStudy: 3,
          phone: '+1-555-0101',
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash,
      role: UserRole.admin,
      isActive: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          studentId: 'STU-2024-0001',
          fullName: 'Sarah Williams',
          department: 'Administration',
          yearOfStudy: null,
          phone: '+1-555-0202',
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
  });

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@test.com',
      passwordHash,
      role: UserRole.super_admin,
      isActive: true,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          studentId: 'STU-2024-0000',
          fullName: 'David Admin',
          department: 'Administration',
          yearOfStudy: null,
          phone: '+1-555-0303',
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
  });

  console.log('Created users:', { voter: voter.id, admin: admin.id, superAdmin: superAdmin.id });

  // Create sample election
  const election = await prisma.election.create({
    data: {
      title: 'College Student Council Election 2026',
      description: 'Annual election for student council representatives',
      type: ElectionType.student,
      status: ElectionStatus.scheduled,
      startTime: new Date('2026-10-01T09:00:00Z'),
      endTime: new Date('2026-10-01T18:00:00Z'),
      createdBy: admin.id,
      settings: {
        allowNOTA: true,
        resultVisibility: 'after_close',
        requireStudentId: true,
      },
    },
  });

  // Create positions
  const presidentPosition = await prisma.electionPosition.create({
    data: {
      electionId: election.id,
      title: 'President',
      description: 'Student council president',
      displayOrder: 1,
      maxSelections: 1,
    },
  });

  const vicePresidentPosition = await prisma.electionPosition.create({
    data: {
      electionId: election.id,
      title: 'Vice President',
      description: 'Student council vice president',
      displayOrder: 2,
      maxSelections: 1,
    },
  });

  // Create candidates
  await prisma.candidate.createMany({
    data: [
      {
        electionId: election.id,
        positionId: presidentPosition.id,
        name: 'Alice Johnson',
        manifesto: 'I will focus on improving campus facilities and student engagement.',
        party: 'Student Alliance',
        status: CandidateStatus.approved,
      },
      {
        electionId: election.id,
        positionId: presidentPosition.id,
        name: 'Bob Smith',
        manifesto: 'My priority is mental health support and academic excellence.',
        party: 'Progress Party',
        status: CandidateStatus.approved,
      },
      {
        electionId: election.id,
        positionId: presidentPosition.id,
        name: 'Charlie Brown',
        manifesto: 'I will work towards better career opportunities for students.',
        party: 'Future Forward',
        status: CandidateStatus.approved,
      },
      {
        electionId: election.id,
        positionId: vicePresidentPosition.id,
        name: 'Diana Martinez',
        manifesto: 'Supporting the president and ensuring inclusive governance.',
        party: 'Student Alliance',
        status: CandidateStatus.approved,
      },
      {
        electionId: election.id,
        positionId: vicePresidentPosition.id,
        name: 'Edward Lee',
        manifesto: 'Bringing innovation and transparency to student government.',
        party: 'Progress Party',
        status: CandidateStatus.approved,
      },
    ],
  });

  // Create voter eligibility
  await prisma.electionVoterEligibility.create({
    data: {
      electionId: election.id,
      voterId: voter.profile!.id,
      isEligible: true,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'ELECTION_CREATED',
      actorId: admin.id,
      targetType: 'election',
      targetId: election.id,
      metadata: {
        electionTitle: election.title,
        electionType: election.type,
      },
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  });

  console.log('Created election:', election.id);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
