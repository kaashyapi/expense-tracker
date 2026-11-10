import React from 'react';
import { Tag, Plus } from 'lucide-react';

export default function CategoriesSection({
  categories = [],
  categoryStats = {},
  onOpenAddCategory,
  onSelectCategoryFilter
}) {
  return (
    <section className="space-y-3">
      {/* Categories Card Container */}
      <div className="bg-[#09090b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm">
        
        {/* Header with + icon on top right */}
        <div className="p-3.5 sm:p-5 border-b border-[#1f1f23] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-[#a1a1aa]" />
            <h2 className="text-base font-semibold text-white tracking-tight">Categories</h2>
          </div>

          <button
            onClick={onOpenAddCategory}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] text-white text-xs font-medium transition-colors active:scale-95 shadow-sm"
            title="Add new custom category"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="hidden xs:inline">New Category</span>
            <span className="xs:hidden">New</span>
          </button>
        </div>

        {/* Category Grid */}
        <div className="p-3 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-2.5">
            {categories.map((cat) => {
              const stat = categoryStats[cat.name] || { total: 0, count: 0 };
              return (
                <div
                  key={cat.name}
                  onClick={() => onSelectCategoryFilter && onSelectCategoryFilter(cat.name)}
                  className="p-2 sm:p-2.5 rounded-lg bg-[#121214] border border-[#222226] hover:border-[#3f3f46] transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xl select-none group-hover:scale-110 transition-transform">
                      {cat.emoji}
                    </span>
                    {!cat.is_default && (
                      <span className="text-[9px] font-mono uppercase bg-[#27272a] text-[#a1a1aa] px-1 py-0.5 rounded">
                        custom
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-medium text-white truncate" title={cat.name}>
                      {cat.name}
                    </div>
                    <div className="text-[11px] text-[#71717a] mt-0.5 font-mono">
                      €{Number(stat.total || 0).toFixed(2)} • {stat.count || 0}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}

