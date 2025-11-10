"use client";
import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
  valuePrefix?: string;
  height?: number;
}

export const SimpleBarChart: React.FC<BarChartProps> = ({
  data,
  title,
  color = '#1ecb4f',
  valuePrefix = '',
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        height: height
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      height: height,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{ margin: '0 0 24px 0', color: '#333', fontSize: '16px', fontWeight: 600 }}>{title}</h3>
      
      <div style={{ 
        flex: 1,
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {data.slice(0, 10).map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{
                fontSize: '13px',
                color: '#666',
                fontWeight: 500
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#333'
              }}>
                {valuePrefix}{item.value.toLocaleString()}
              </span>
            </div>
            
            <div style={{ 
              width: '100%',
              height: '8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${(item.value / maxValue) * 100}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
  color?: string;
  valuePrefix?: string;
}

export const SimpleLineChart: React.FC<LineChartProps> = ({
  data,
  title,
  color = '#1ecb4f',
  valuePrefix = ''
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>{title}</h3>
        <p style={{ color: '#666', textAlign: 'center', padding: '40px 0' }}>No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px' }}>{title}</h3>
      
      <div style={{ 
        position: 'relative', 
        height: `${chartHeight}px`,
        borderLeft: '2px solid #e0e0e0',
        borderBottom: '2px solid #e0e0e0',
        paddingLeft: '10px',
        paddingBottom: '30px'
      }}>
        <svg width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
          {/* Line */}
          <polyline
            points={data.map((item, index) => {
              const x = (index / (data.length - 1 || 1)) * 100;
              const y = chartHeight - (item.value / maxValue) * (chartHeight - 20);
              return `${x}%,${y}`;
            }).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="3"
          />
          
          {/* Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = chartHeight - (item.value / maxValue) * (chartHeight - 20);
            return (
              <g key={index}>
                <circle
                  cx={`${x}%`}
                  cy={y}
                  r="5"
                  fill={color}
                />
                <text
                  x={`${x}%`}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#666"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px'
      }}>
        <span style={{ color: '#666' }}>
          Max: <strong>{valuePrefix}{maxValue.toLocaleString()}</strong>
        </span>
        <span style={{ color: '#666' }}>
          Total Points: <strong>{data.length}</strong>
        </span>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon = '📊',
  color = '#1ecb4f',
  subtitle
}) => {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: `2px solid ${color}20`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: color
      }} />
      
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      
      <div style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {title}
      </div>
      
      <div style={{
        fontSize: '28px',
        fontWeight: 700,
        color: '#333',
        marginBottom: subtitle ? '4px' : 0
      }}>
        {value}
      </div>
      
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#999' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
