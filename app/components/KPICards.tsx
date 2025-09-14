"use client";
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  format?: 'currency' | 'number' | 'percentage' | 'text';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = '#1ecb4f',
  format = 'text'
}) => {
  const formatValue = (val: string | number) => {
    switch (format) {
      case 'currency':
        return `Rs.${parseFloat(String(val)).toFixed(2)}`;
      case 'number':
        return parseFloat(String(val)).toLocaleString();
      case 'percentage':
        return `${parseFloat(String(val)).toFixed(1)}%`;
      default:
        return val;
    }
  };

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${color}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: color
      }} />
      
      {/* Icon */}
      {icon && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          color: color,
          opacity: 0.2,
          fontSize: '32px'
        }}>
          {icon}
        </div>
      )}

      {/* Content */}
      <div>
        <h3 style={{
          margin: '0 0 8px 0',
          color: '#666',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {title}
        </h3>
        
        <div style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#333',
          marginBottom: '8px'
        }}>
          {formatValue(value)}
        </div>

        {/* Change indicator */}
        {change !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {isPositive ? (
              <TrendingUp size={16} color="#1ecb4f" />
            ) : isNegative ? (
              <TrendingDown size={16} color="#ff3b3b" />
            ) : null}
            
            <span style={{
              color: isPositive ? '#1ecb4f' : isNegative ? '#ff3b3b' : '#666'
            }}>
              {isPositive ? '+' : ''}{change.toFixed(1)}%
            </span>
            
            {changeLabel && (
              <span style={{ color: '#666', fontSize: '12px' }}>
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface KPIGridProps {
  kpis: KPICardProps[];
  columns?: number;
}

export const KPIGrid: React.FC<KPIGridProps> = ({ kpis, columns = 4 }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '20px',
      marginBottom: '30px'
    }}>
      {kpis.map((kpi, index) => (
        <KPICard key={index} {...kpi} />
      ))}
    </div>
  );
};

// Predefined KPI configurations
export const createSalesKPIs = (data: any) => [
  {
    title: 'Total Revenue',
    value: data.salesMetrics?.total_revenue || 0,
    change: data.growthRate,
    changeLabel: 'vs last period',
    icon: <DollarSign />,
    color: '#1ecb4f',
    format: 'currency' as const
  },
  {
    title: 'Transactions',
    value: data.salesMetrics?.total_transactions || 0,
    icon: <ShoppingCart />,
    color: '#8884d8',
    format: 'number' as const
  },
  {
    title: 'Avg. Transaction',
    value: data.salesMetrics?.avg_transaction_value || 0,
    icon: <TrendingUp />,
    color: '#82ca9d',
    format: 'currency' as const
  },
  {
    title: 'Growth Rate',
    value: data.growthRate || 0,
    icon: <TrendingUp />,
    color: data.growthRate >= 0 ? '#1ecb4f' : '#ff3b3b',
    format: 'percentage' as const
  }
];

export const createInventoryKPIs = (data: any) => [
  {
    title: 'Total Products',
    value: data.inventoryHealth?.total_products || 0,
    icon: <Package />,
    color: '#8884d8',
    format: 'number' as const
  },
  {
    title: 'In Stock',
    value: data.inventoryHealth?.healthy_stock || 0,
    icon: <CheckCircle />,
    color: '#1ecb4f',
    format: 'number' as const
  },
  {
    title: 'Low Stock',
    value: data.inventoryHealth?.low_stock || 0,
    icon: <AlertTriangle />,
    color: '#ff9500',
    format: 'number' as const
  },
  {
    title: 'Out of Stock',
    value: data.inventoryHealth?.out_of_stock || 0,
    icon: <AlertTriangle />,
    color: '#ff3b3b',
    format: 'number' as const
  }
];

export const createPerformanceKPIs = (data: any) => [
  {
    title: 'Stockout Rate',
    value: data.kpis?.stockoutRate || 0,
    icon: <AlertTriangle />,
    color: data.kpis?.stockoutRate > 10 ? '#ff3b3b' : '#1ecb4f',
    format: 'percentage' as const
  },
  {
    title: 'Inventory Turnover',
    value: data.kpis?.inventoryTurnover || 0,
    icon: <TrendingUp />,
    color: '#82ca9d',
    format: 'number' as const
  },
  {
    title: 'Active Cashiers',
    value: data.cashierPerformance?.length || 0,
    icon: <Users />,
    color: '#8884d8',
    format: 'number' as const
  },
  {
    title: 'Top Category',
    value: data.categoryPerformance?.[0]?.category || 'N/A',
    icon: <Package />,
    color: '#1ecb4f',
    format: 'text' as const
  }
];
