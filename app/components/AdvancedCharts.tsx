"use client";
import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface ChartProps {
  data: any[];
  title: string;
  height?: number;
}

// Sales Trend Chart
export const SalesTrendChart: React.FC<ChartProps> = ({ data, title, height = 300 }) => {
  const chartData = data.map(item => ({
    date: new Date(item.date).toLocaleDateString(),
    revenue: parseFloat(item.revenue),
    transactions: parseInt(item.transactions),
    avgValue: parseFloat(item.avg_value)
  }));

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#666" fontSize={12} />
          <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="revenue" 
            stroke="#8884d8" 
            fill="#8884d8" 
            fillOpacity={0.3}
            name="Revenue"
          />
          <Bar 
            yAxisId="right"
            dataKey="transactions" 
            fill="#82ca9d" 
            name="Transactions"
            radius={[4, 4, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Product Performance Chart
export const ProductPerformanceChart: React.FC<ChartProps> = ({ data, title, height = 300 }) => {
  const chartData = data.slice(0, 10).map(item => ({
    name: item.name,
    revenue: parseFloat(item.total_revenue),
    sold: parseInt(item.total_sold),
    stock: parseInt(item.current_stock)
  }));

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" stroke="#666" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} width={100} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[0, 4, 4, 0]} />
          <Bar dataKey="sold" fill="#82ca9d" name="Units Sold" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Category Performance Pie Chart
export const CategoryPieChart: React.FC<ChartProps> = ({ data, title, height = 300 }) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="total_revenue"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
            formatter={(value: any) => [`Rs.${value.toFixed(2)}`, 'Revenue']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Peak Hours Chart
export const PeakHoursChart: React.FC<ChartProps> = ({ data, title, height = 300 }) => {
  const chartData = data.map(item => ({
    hour: `${item.hour}:00`,
    transactions: parseInt(item.transactions),
    revenue: parseFloat(item.revenue)
  }));

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="hour" stroke="#666" fontSize={12} />
          <YAxis yAxisId="left" stroke="#8884d8" fontSize={12} />
          <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" fontSize={12} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="transactions" fill="#8884d8" name="Transactions" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={3} name="Revenue" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Cashier Performance Chart
export const CashierPerformanceChart: React.FC<ChartProps> = ({ data, title, height = 300 }) => {
  const chartData = data.map(item => ({
    name: item.name,
    transactions: parseInt(item.transactions_processed),
    revenue: parseFloat(item.total_revenue),
    avgValue: parseFloat(item.avg_transaction_value)
  }));

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" stroke="#666" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} width={100} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Bar dataKey="revenue" fill="#8884d8" name="Revenue" radius={[0, 4, 4, 0]} />
          <Bar dataKey="transactions" fill="#82ca9d" name="Transactions" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Inventory Health Radar Chart
export const InventoryHealthRadarChart: React.FC<{ data: any; title: string; height?: number }> = ({ data, title, height = 300 }) => {
  const radarData = [
    { metric: 'Total Products', value: data.total_products || 0, fullMark: 100 },
    { metric: 'In Stock', value: data.healthy_stock || 0, fullMark: 100 },
    { metric: 'Low Stock', value: data.low_stock || 0, fullMark: 100 },
    { metric: 'Out of Stock', value: data.out_of_stock || 0, fullMark: 100 },
  ];

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 600 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
          <PolarGrid stroke="#f0f0f0" />
          <PolarAngleAxis dataKey="metric" stroke="#666" fontSize={12} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#666" fontSize={12} />
          <Radar name="Inventory Health" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          <Tooltip 
            contentStyle={{ 
              background: 'rgba(255,255,255,0.95)', 
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
