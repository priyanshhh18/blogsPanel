import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Add any necessary connection test logic here
    // For example, check database connection, external API status, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Blog API is connected and running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Connection test failed:', error);
    return NextResponse.json(
      { success: false, error: 'Connection test failed' },
      { status: 500 }
    );
  }
}
