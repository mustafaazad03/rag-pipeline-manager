import React from 'react'

export default function Loading() {
  return (
    <div className="flex items-start mt-4">
      <div className="w-10 h-10 rounded-full bg-gray-300" />
      <div className="ml-4 w-full">
        <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
      </div>
    </div>
  )
}
