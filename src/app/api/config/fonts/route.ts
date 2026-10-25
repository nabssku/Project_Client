import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const configs = await prisma.site_configs.findMany({
      where: {
        key: {
          in: ['font_body', 'font_display'],
        },
      },
    });

    const fontConfig = configs.reduce((acc: any, config: any) => {
      if (config.key === 'font_body') acc.font_body = config.value;
      if (config.key === 'font_display') acc.font_display = config.value;
      return acc;
    }, {} as Record<string, string>);

    // Default fonts jika belum ada di database
    if (!fontConfig.font_body) fontConfig.font_body = 'DM Sans';
    if (!fontConfig.font_display) fontConfig.font_display = 'Playfair Display';

    return NextResponse.json(fontConfig);
  } catch (error) {
    console.error('Error fetching font config:', error);
    return NextResponse.json(
      { font_body: 'DM Sans', font_display: 'Playfair Display' },
      { status: 500 }
    );
  }
}
