"use client";
import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign, Package, Users, ShoppingCart } from 'lucide-react';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  fullWidth?: boolean;
}

export const DashboardWidget: React.FC<WidgetProps> = ({
  title,
  children,
  icon,
  color = '#1ecb4f',
  fullWidth = false
}) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `1px solid ${color}20`,
      gridColumn: fullWidth ? '1 / -1' : 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {icon && (
          <div style={{
            color: color,
            fontSize: '20px'
          }}>
            {icon}
          </div>
        )}
        <h3 style={{
          margin: 0,
          color: '#333',
          fontSize: '18px',
          fontWeight: 600
        }}>
          {title}
        </h3>
      </div>

      {/* Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

// Quick Stats Widget
interface QuickStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    change?: number;
    icon?: React.ReactNode;
    color?: string;
  }>;
}

export const QuickStatsWidget: React.FC<QuickStatsProps> = ({ stats }) => {
  return (
    <DashboardWidget title="Quick Stats" icon={<TrendingUp />}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{
            textAlign: 'center',
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: `2px solid ${stat.color || '#1ecb4f'}20`
          }}>
            {stat.icon && (
              <div style={{
                color: stat.color || '#1ecb4f',
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                {stat.icon}
              </div>
            )}
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#333',
              marginBottom: '4px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px'
            }}>
              {stat.label}
            </div>
            {stat.change !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500,
                color: stat.change >= 0 ? '#1ecb4f' : '#ff3b3b'
              }}>
                {stat.change >= 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {stat.change >= 0 ? '+' : ''}{stat.change.toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
};

// Alert Widget
interface AlertProps {
  title: string;
  message: string;
  type: 'warning' | 'error' | 'success' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const AlertWidget: React.FC<AlertProps> = ({ title, message, type, action }) => {
  const colors = {
    warning: '#ff9500',
    error: '#ff3b3b',
    success: '#1ecb4f',
    info: '#007bff'
  };

  const icons = {
    warning: <AlertTriangle />,
    error: <AlertTriangle />,
    success: <CheckCircle />,
    info: <TrendingUp />
  };

  return (
    <DashboardWidget title={title} icon={icons[type]} color={colors[type]}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            margin: 0,
            color: '#333',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              padding: '8px 16px',
              background: colors[type],
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </DashboardWidget>
  );
};

// Summary Widget
interface SummaryProps {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
}

export const SummaryWidget: React.FC<SummaryProps> = ({ title, items }) => {
  return (
    <DashboardWidget title={title}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {items.map((item, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            background: '#f8f9fa',
            borderRadius: '6px'
          }}>
            <span style={{
              fontSize: '14px',
              color: '#666'
            }}>
              {item.label}
            </span>
            <span style={{
              fontSize: '16px',
              fontWeight: 600,
              color: item.color || '#333'
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
};

// Chart Container Widget
interface ChartContainerProps {
  title: string;
  children: React.ReactNode;
  height?: number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, height = 300 }) => {
  return (
    <DashboardWidget title={title}>
      <div style={{ height }}>
        {children}
      </div>
    </DashboardWidget>
  );
};

// Data Table Widget
interface DataTableProps {
  title: string;
  data: any[];
  columns: Array<{
    key: string;
    label: string;
    width?: number;
  }>;
  height?: number;
}

export const DataTableWidget: React.FC<DataTableProps> = ({ title, data, columns, height = 300 }) => {
  return (
    <DashboardWidget title={title}>
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
                <th key={column.key} style={{
                  padding: '12px 8px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#333',
                  width: column.width
                }}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                borderBottom: '1px solid #f0f0f0',
                '&:hover': {
                  background: '#f8f9fa'
                }
              }}>
                {columns.map(column => (
                  <td key={column.key} style={{
                    padding: '12px 8px',
                    color: '#333'
                  }}>
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardWidget>
  );
};
