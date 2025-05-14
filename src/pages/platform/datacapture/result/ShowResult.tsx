import * as React from 'react';
import { useEffect, useState } from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { CheckCircledIcon, CrossCircledIcon, Link2Icon, ChevronDownIcon } from '@radix-ui/react-icons';

interface ChangeField {
  changed: boolean;
  previous?: string;
  current?: string;
  details?: any;
  changes?: Array<any>;
}

interface Comparison {
  _id: string;
  url: string;
  currentDate: string;
  previousDate: string;
  changes: {
    title?: ChangeField;
    headings?: ChangeField;
    ctaElements?: ChangeField;
    mainHeadings?: ChangeField;
    performanceMetrics?: ChangeField;
    securityAndAccessibility?: ChangeField;
  };
  hasChanges: boolean;
  changeScore: number;
}

function getChangedFields(changes: Comparison['changes']) {
  return Object.entries(changes)
    .filter(([key, value]) => value && value.changed)
    .map(([key, value]) => ({ key, value }));
}

const labelMap: Record<string, string> = {
  title: 'Title',
  headings: 'Headings',
  ctaElements: 'CTA Elements',
  mainHeadings: 'Main Headings',
  performanceMetrics: 'Performance Metrics',
  securityAndAccessibility: 'Security & Accessibility',
};

function formatDate(date: string) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function renderNestedChanges(
  value: any,
  isCurrent: boolean,
  parentKey: string = ''
): React.ReactNode {
  if (!value) return '-';

  // If this is a leaf node with previous/current
  if (
    typeof value === 'object' &&
    ('previous' in value || 'current' in value) &&
    !('changes' in value)
  ) {
    return (
      <div className={`p-2 rounded ${isCurrent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} border min-h-[32px]`}>
        {isCurrent ? value.current ?? '-' : value.previous ?? '-'}
      </div>
    );
  }

  // If this is a nested object with changed children
  if (typeof value === 'object') {
    return (
      <div className="space-y-2 pl-2 border-l-2 border-dashed border-gray-200">
        {Object.entries(value)
          .filter(
            ([k, v]: [string, any]) =>
              v &&
              typeof v === 'object' &&
              v.changed === true &&
              (v.previous !== undefined || v.current !== undefined || v.changes || Object.values(v).some((child: any) => child && child.changed))
          )
          .map(([k, v]: [string, any]) => (
            <div key={k}>
              <div className="font-medium text-xs text-gray-600 mb-1">{labelMap[k] || k}</div>
              {renderNestedChanges(v, isCurrent, k)}
            </div>
          ))}
      </div>
    );
  }

  return '-';
}

function renderChangeValue(value: any, label: string, date: string, isCurrent: boolean, key?: string) {
  // For performanceMetrics and securityAndAccessibility, use recursive renderer
  if (key === 'performanceMetrics' || key === 'securityAndAccessibility') {
    return renderNestedChanges(value, isCurrent, key);
  }
  // If value has a 'changes' array, render each change
  if (value && Array.isArray(value.changes)) {
    if (!value.changes.length) return <div className="italic text-gray-400">No changes</div>;
    return (
      <div className="space-y-2">
        {value.changes.map((item: any, idx: number) => (
          <div key={idx} className="mb-2">
            <div className="text-xs text-gray-500 mb-1">
              {item.index !== undefined ? `Index: ${item.index}` : ''}
            </div>
            <div className={`p-2 rounded ${isCurrent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} border min-h-[32px]`}>
              {isCurrent ? (item.current ?? '-') : (item.previous ?? '-')}
            </div>
          </div>
        ))}
      </div>
    );
  }
  // Fallback for simple value
  return (
    <div className={`p-3 rounded-lg ${isCurrent ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} border min-h-[40px] whitespace-pre-wrap break-words`}>
      {isCurrent ? (value?.current ?? '-') : (value?.previous ?? '-')}
    </div>
  );
}

const ShowResult: React.FC = () => {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/data-capture/page-comparison')
      .then(res => res.json())
      .then(data => {
        setComparisons(data.comparisons || []);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, []);

  const handleAccordionChange = (value: string[]) => {
    setExpandedItems(value);
  };

  if (isLoading) return <div className="text-center py-8 text-white">Loading...</div>;
  if (hasError) return <div className="text-center text-red-400 py-8">Error loading comparison data.</div>;
  if (!comparisons.length) return <div className="text-center py-8 text-white">No comparison data found.</div>;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Page Comparison Results</h1>
        <Accordion.Root 
          type="multiple" 
          className="space-y-6"
          value={expandedItems}
          onValueChange={handleAccordionChange}
        >
          {comparisons.map(comparison => {
            const changedFields = getChangedFields(comparison.changes);
            if (!changedFields.length) return null;
            const isExpanded = expandedItems.includes(comparison._id);
            return (
              <Accordion.Item
                key={comparison._id}
                value={comparison._id}
                className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold text-base hover:brightness-105 transition">
                    <div className="flex items-center gap-2">
                      <Link2Icon />
                      <span
                        className="truncate max-w-[50vw] underline decoration-dotted cursor-pointer"
                        title={comparison.url}
                      >
                        {comparison.url}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-black bg-opacity-20 px-3 py-1 rounded-full">
                        {formatDate(comparison.currentDate)}
                      </span>
                      {/* <div className="flex items-center gap-1">
                        <span className="text-xs font-normal">Score:</span>
                        <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded-full min-w-[40px] text-center">
                          {comparison.changeScore}
                        </span>
                      </div> */}
                      <ChevronDownIcon className={`transition-transform duration-300 ${isExpanded ? 'transform rotate-180' : ''}`} />
                    </div>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="px-6 py-4 space-y-6 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                  {changedFields.map(({ key, value }, idx) => (
                    <div key={key}>
                      <div className="font-semibold text-lg mb-2 text-gray-800 flex items-center gap-2">
                        {labelMap[key] || key}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <CrossCircledIcon className="text-red-400" />
                            Previous Value
                            {comparison.previousDate ? ` (${formatDate(comparison.previousDate)})` : ''}
                          </div>
                          {renderChangeValue(value, 'Previous', comparison.previousDate, false, key)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <CheckCircledIcon className="text-green-400" />
                            Current Value
                            {comparison.currentDate ? ` (${formatDate(comparison.currentDate)})` : ''}
                          </div>
                          {renderChangeValue(value, 'Current', comparison.currentDate, true, key)}
                        </div>
                      </div>
                      {idx < changedFields.length - 1 && (
                        <div className="my-4 border-b border-dashed border-gray-200" />
                      )}
                    </div>
                  ))}
                </Accordion.Content>
              </Accordion.Item>
            );
          })}
        </Accordion.Root>
      </div>
    </div>
  );
};

export default ShowResult;