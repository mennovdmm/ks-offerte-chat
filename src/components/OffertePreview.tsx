import React from 'react';

interface OffertePreviewProps {
  content: string;
}

const OffertePreview: React.FC<OffertePreviewProps> = ({ content }) => {
  const formatContent = (text: string) => {
    if (!text.trim()) {
      return (
        <div className="text-gray-500 text-center py-8">
          <p>De offerte wordt hier opgebouwd tijdens het gesprek...</p>
        </div>
      );
    }

    // Split content into sections and format
    const sections = text.split('\n\n');
    
    return sections.map((section, index) => {
      const lines = section.split('\n');
      const title = lines[0];
      const body = lines.slice(1).join('\n');

      // Check if this looks like a section header
      const isHeader = title && (
        title.includes('ONS ADVIES') ||
        title.includes('UW SITUATIE') ||
        title.includes('UW WONING') ||
        title.includes('STYLING') ||
        title.includes('ENERGIELABEL') ||
        title.includes('LOKALE EXPERTISE') ||
        title.includes('ONS PROCES') ||
        title.includes('KOSTEN') ||
        title.includes('CONTACTPERSOON') ||
        title.includes('VOLGENDE STAP') ||
        title.toUpperCase() === title
      );

      return (
        <div key={index} className="mb-6">
          {isHeader ? (
            <>
              <h3 className="text-lg font-bold text-ks-green mb-3 font-georgia">
                {title}
              </h3>
              {body && (
                <div className="text-gray-800 font-georgia leading-relaxed whitespace-pre-line">
                  {body}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-800 font-georgia leading-relaxed whitespace-pre-line">
              {section}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-800">Offerte Preview</h2>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-none">
          {/* K&S Header */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-ks-green font-georgia mb-2">
              Keij & Stefels
            </h1>
            <p className="text-gray-600 font-georgia">
              Makelaardij & Taxaties
            </p>
          </div>
          
          {/* Dynamic Content */}
          <div>
            {formatContent(content)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffertePreview;