import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/apiAuth";
import { PERMISSIONS } from "@/lib/permissions";
import bcrypt from "bcryptjs";

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_USERS);
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { userRoles: { include: { role: true } } },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.ADMIN_USERS);
  if (error) return error;

  try {
    const { name, email, password, roleId } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password: hashedPassword,
        userRoles: roleId ? { create: { roleId } } : undefined,
      },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
