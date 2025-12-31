import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/server/auth"
import { prisma } from "@/lib/server/prisma"

interface UpdateProfileRequest {
  displayName?: string | null
}

interface UpdateProfileResponse {
  success: boolean
  message?: string
}

export async function PATCH(request: NextRequest): Promise<NextResponse<UpdateProfileResponse>> {
  try {
    const { profile } = await requireAuthenticatedUser()

    const body: UpdateProfileRequest = await request.json()
    const { displayName } = body

    // Update the user profile
    await prisma.user.update({
      where: { id: profile.id },
      data: {
        displayName: displayName?.trim() || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    console.error("Error updating profile:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 }
    )
  }
}

