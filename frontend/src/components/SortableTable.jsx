import React from 'react';

export default function SortableTable({
  headers = [],
  data = [],
  sortField = '',
  sortOrder = 'asc',
  onSort = null,
  renderRow = null,
  noDataMessage = 'No matching records found.'
}) {
  const handleHeaderClick = (header) => {
    if (!header.sortable || !onSort) return;
    onSort(header.key);
  };

  const renderSortIcon = (headerKey) => {
    if (sortField !== headerKey) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h.key}
                className={h.sortable ? 'sortable' : ''}
                onClick={() => handleHeaderClick(h)}
                style={{ width: h.width || 'auto' }}
              >
                {h.label}
                {h.sortable && (
                  <span className="sort-icon">{renderSortIcon(h.key)}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item.id || index}>{renderRow(item, index)}</tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="no-data">
                {noDataMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
