import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '../../../lib/utils/tempDB';
import PageComparisonModel from '../../../schemas/data-capture/page-comparison.schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const comparisons = await PageComparisonModel.find({}, {
      url: 1,
      currentDate: 1,
      previousDate: 1,
      'changes.title': 1,
      'changes.headings': 1,
      'changes.ctaElements': 1,
      'changes.mainHeadings': 1,
      'changes.performanceMetrics': 1,
      'changes.securityAndAccessibility': 1,
      hasChanges: 1,
      changeScore: 1,
      createdAt: 1,
      updatedAt: 1,
    })
      .sort({ currentDate: -1 })
      .lean();

    res.status(200).json({ comparisons });
  } catch (error: unknown) {
    console.error('Error fetching page comparisons:', error);
    res.status(500).json({ error: 'Failed to fetch page comparisons' });
  }
} 