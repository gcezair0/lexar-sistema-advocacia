import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Office
  const office = await prisma.office.create({
    data: {
      name: 'Escritório Lexar Advocacia',
      cnpj: '12.345.678/0001-99',
      phone: '11999999999',
      email: 'contato@lexar.adv.br',
      address: 'Rua da Justiça, 100 - São Paulo/SP',
    },
  })
  console.log('✅ Office created:', office.name)

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@lexar.adv.br',
      password: adminPassword,
      role: 'ADMIN',
      officeId: office.id,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Lawyer User
  const lawyerPassword = await bcrypt.hash('lawyer123', 10)
  const lawyer = await prisma.user.create({
    data: {
      name: 'Dr. João Silva',
      email: 'joao@lexar.adv.br',
      password: lawyerPassword,
      role: 'LAWYER',
      oabNumber: 'OAB/SP 123.456',
      phone: '11988888888',
      officeId: office.id,
    },
  })
  console.log('✅ Lawyer created:', lawyer.email)

  // Create Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Maria Oliveira',
      email: 'maria@email.com',
      phone: '11977777777',
      cpfCnpj: '123.456.789-00',
      status: 'ACTIVE',
      tags: ['trabalhista', 'urgente'],
      lgpdConsent: true,
      consentDate: new Date(),
      officeId: office.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Carlos Santos',
      email: 'carlos@email.com',
      phone: '11966666666',
      cpfCnpj: '987.654.321-00',
      status: 'ACTIVE',
      tags: ['cível'],
      lgpdConsent: true,
      consentDate: new Date(),
      officeId: office.id,
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'Ana Costa',
      phone: '11955555555',
      status: 'LEAD',
      tags: ['família'],
      officeId: office.id,
    },
  })
  console.log('✅ Clients created:', 3)

  // Create Processes
  const process1 = await prisma.process.create({
    data: {
      number: '0001234-56.2026.8.26.0100',
      title: 'Reclamação Trabalhista - Maria Oliveira',
      description: 'Ação de indenização por danos morais e materiais',
      court: 'TRT-2 - São Paulo',
      actionType: 'Trabalhista',
      status: 'ACTIVE',
      clientId: client1.id,
      lawyerId: lawyer.id,
      officeId: office.id,
    },
  })

  const process2 = await prisma.process.create({
    data: {
      number: '0005678-90.2026.8.26.0100',
      title: 'Ação de Cobrança - Carlos Santos',
      description: 'Cobrança de dívida contratual',
      court: 'TJSP - Foro Central',
      actionType: 'Cível',
      status: 'ACTIVE',
      clientId: client2.id,
      lawyerId: lawyer.id,
      officeId: office.id,
    },
  })
  console.log('✅ Processes created:', 2)

  // Create Movements
  await prisma.movement.createMany({
    data: [
      {
        title: 'Petição inicial distribuída',
        description: 'Petição inicial protocolada e distribuída',
        processId: process1.id,
      },
      {
        title: 'Audiência inicial designada',
        description: 'Audiência de conciliação marcada para 15/05/2026',
        processId: process1.id,
      },
      {
        title: 'Citação do réu realizada',
        processId: process2.id,
      },
    ],
  })
  console.log('✅ Movements created:', 3)

  // Create Events
  await prisma.event.createMany({
    data: [
      {
        title: 'Audiência de Conciliação - Maria Oliveira',
        description: 'TRT-2 - Sala 5',
        type: 'HEARING',
        startDate: new Date('2026-05-15T14:00:00'),
        endDate: new Date('2026-05-15T15:00:00'),
        assignedToId: lawyer.id,
        clientId: client1.id,
        processId: process1.id,
        officeId: office.id,
      },
      {
        title: 'Prazo para contestação - Carlos Santos',
        type: 'DEADLINE',
        startDate: new Date('2026-04-20T23:59:00'),
        assignedToId: lawyer.id,
        processId: process2.id,
        officeId: office.id,
      },
      {
        title: 'Reunião com novo cliente - Ana Costa',
        type: 'MEETING',
        startDate: new Date('2026-04-10T10:00:00'),
        endDate: new Date('2026-04-10T11:00:00'),
        assignedToId: lawyer.id,
        clientId: client3.id,
        officeId: office.id,
      },
    ],
  })
  console.log('✅ Events created:', 3)

  // Create Lead
  await prisma.lead.create({
    data: {
      name: 'Pedro Almeida',
      phone: '11944444444',
      legalIssue: 'Direito do Consumidor',
      source: 'whatsapp',
      officeId: office.id,
    },
  })
  console.log('✅ Leads created:', 1)

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📋 Login credentials:')
  console.log('   Admin: admin@lexar.adv.br / admin123')
  console.log('   Lawyer: joao@lexar.adv.br / lawyer123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
