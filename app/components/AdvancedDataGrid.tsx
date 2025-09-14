"use client";
import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Eye, TrendingUp, DollarSign, Package, Users } from 'lucide-react';

interface Column {
  key: string;
  name: string;
  width?: number;
  formatter?: (props: any) => React.ReactElement;
  sortable?: boolean;
  resizable?: boolean;
}

interface AdvancedDataGridProps {
  data: any[];
  columns: Column[];
  title: string;
  height?: number;
  onRowClick?: (row: any) => void;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

export const AdvancedDataGrid: React.FC<AdvancedDataGridProps> = ({
  data,
  columns,
  title,
  height = 400,
  onRowClick,
  searchable = true,
  filterable = true,
  exportable = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'ASC' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal || '').toLowerCase();
        const bStr = String(bVal || '').toLowerCase();
        
        if (sortDirection === 'ASC') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortColumn(columnKey);
      setSortDirection('ASC');
    }
  };

  const handleExport = () => {
    const csvContent = [
      // Header
      columns.map(col => col.name).join(','),
      // Data
      ...filteredData.map(row =>
        columns.map(col => {
          const value = row[col.key];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatValue = (value: any, column: Column) => {
    // Format currency
    if (column.key.includes('revenue') || column.key.includes('price') || column.key.includes('amount')) {
      return <span style={{ color: '#1ecb4f', fontWeight: 600 }}>Rs.{parseFloat(value || 0).toFixed(2)}</span>;
    }
    
    // Format numbers
    if (typeof value === 'number') {
      return <span style={{ fontWeight: 500 }}>{value.toLocaleString()}</span>;
    }
    
    // Format dates
    if (column.key.includes('date') && value) {
      return <span>{new Date(value).toLocaleDateString()}</span>;
    }
    
    // Format status
    if (column.key.includes('status')) {
      const statusColors: { [key: string]: string } = {
        'In Stock': '#1ecb4f',
        'Low Stock': '#ff9500',
        'Out of Stock': '#ff3b3b',
        'approved': '#1ecb4f',
        'pending': '#ff9500',
        'rejected': '#ff3b3b'
      };
      return (
        <span style={{ 
          color: statusColors[value] || '#666',
          fontWeight: 600,
          padding: '4px 8px',
          borderRadius: '12px',
          background: `${statusColors[value]}20`,
          fontSize: '12px'
        }}>
          {value}
        </span>
      );
    }
    
    return <span>{value}</span>;
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '20px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      height: height + 120
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: 600 }}>
          {title}
        </h3>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Search */}
          {searchable && (
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: '8px 12px 8px 35px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '200px'
                }}
              />
            </div>
          )}
          
          {/* Export Button */}
          {exportable && (
            <button
              onClick={handleExport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: '#1ecb4f',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              <Download size={16} />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div style={{ height, overflow: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              background: '#f8f9fa',
              borderBottom: '2px solid #e0e0e0'
            }}>
              {columns.map(column => (
                <th 
                  key={column.key} 
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#333',
                    width: column.width,
                    cursor: column.sortable ? 'pointer' : 'default'
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {column.name}
                    {column.sortable && sortColumn === column.key && (
                      <span style={{ fontSize: '12px' }}>
                        {sortDirection === 'ASC' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr 
                key={index} 
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:hover': {
                    background: '#f8f9fa'
                  }
                }}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map(column => (
                  <td key={column.key} style={{
                    padding: '12px 8px',
                    color: '#333'
                  }}>
                    {formatValue(row[column.key], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Stats */}
      <div style={{ 
        marginTop: '15px', 
        padding: '10px 0', 
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <span>Showing {filteredData.length} of {data.length} records</span>
        {searchTerm && (
          <span>Filtered by: "{searchTerm}"</span>
        )}
      </div>
    </div>
  );
};

// Predefined column configurations for common data types
export const productColumns: Column[] = [
  { key: 'name', name: 'Product Name', width: 200, sortable: true },
  { key: 'category', name: 'Category', width: 120, sortable: true },
  { key: 'current_stock', name: 'Stock', width: 80, sortable: true },
  { key: 'total_revenue', name: 'Revenue', width: 120, sortable: true },
  { key: 'total_sold', name: 'Sold', width: 80, sortable: true },
  { key: 'stock_status', name: 'Status', width: 100, sortable: true }
];

export const salesColumns: Column[] = [
  { key: 'date', name: 'Date', width: 120, sortable: true },
  { key: 'total_amount', name: 'Amount', width: 120, sortable: true },
  { key: 'cashier_name', name: 'Cashier', width: 150, sortable: true },
  { key: 'items_count', name: 'Items', width: 80, sortable: true },
  { key: 'payment_method', name: 'Payment', width: 100, sortable: true }
];

export const cashierColumns: Column[] = [
  { key: 'name', name: 'Cashier Name', width: 200, sortable: true },
  { key: 'transactions_processed', name: 'Transactions', width: 120, sortable: true },
  { key: 'total_revenue', name: 'Revenue', width: 120, sortable: true },
  { key: 'avg_transaction_value', name: 'Avg. Transaction', width: 140, sortable: true }
];
