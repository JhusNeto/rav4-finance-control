'use client'

import { HourlySpending, StoreSpending, CategorySpendingMap } from '@/lib/purchaseMaps'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/utils'
import { Clock, Store, Tag } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { getCategoryLabel } from '@/lib/classification'

interface PurchaseMapsViewProps {
  hourlyData: HourlySpending[]
  storeData: StoreSpending[]
  categoryData: CategorySpendingMap[]
}

export function PurchaseMapsView({ hourlyData, storeData, categoryData }: PurchaseMapsViewProps) {
  // Prepara dados para gráficos
  const hourlyChartData = hourlyData.map(d => ({
    hora: `${d.hour}h`,
    total: d.total,
    quantidade: d.count,
    media: d.average
  }))
  
  const storeChartData = storeData.slice(0, 10).map(d => ({
    loja: d.store.length > 20 ? d.store.substring(0, 20) + '...' : d.store,
    total: d.total,
    quantidade: d.count
  }))
  
  const categoryChartData = categoryData.map(d => ({
    categoria: getCategoryLabel(d.category as any),
    total: d.total,
    porcentagem: d.percentage
  }))
  
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Mapas de Compras
        </CardTitle>
        <CardDescription>
          Visualização detalhada dos seus gastos por diferentes dimensões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hourly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hourly" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Por Horário
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Por Loja
            </TabsTrigger>
            <TabsTrigger value="category" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Por Tipo
            </TabsTrigger>
          </TabsList>
          
          {/* Visualização por Horário */}
          <TabsContent value="hourly" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Gastos por Horário do Dia</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" />
                  <YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-xs text-muted-foreground">Horário Mais Caro</div>
                <div className="text-lg font-bold">
                  {hourlyData.reduce((max, d) => d.total > max.total ? d : max, hourlyData[0])?.hour}h
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-xs text-muted-foreground">Total no Horário</div>
                <div className="text-lg font-bold">
                  {formatCurrency(hourlyData.reduce((max, d) => d.total > max.total ? d : max, hourlyData[0])?.total || 0)}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-xs text-muted-foreground">Média por Transação</div>
                <div className="text-lg font-bold">
                  {formatCurrency(hourlyData.reduce((sum, d) => sum + d.average, 0) / hourlyData.length)}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card/50">
                <div className="text-xs text-muted-foreground">Total de Transações</div>
                <div className="text-lg font-bold">
                  {hourlyData.reduce((sum, d) => sum + d.count, 0)}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Visualização por Loja */}
          <TabsContent value="store" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Top 10 Lojas/Estabelecimentos</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={storeChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
                  <YAxis dataKey="loja" type="category" width={150} />
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Detalhes das Lojas</h4>
              {storeData.slice(0, 10).map((store, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex-1">
                    <div className="font-medium">{store.store}</div>
                    <div className="text-sm text-muted-foreground">
                      {store.count} transação(ões)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(store.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      Média: {formatCurrency(store.average)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          {/* Visualização por Categoria */}
          <TabsContent value="category" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ categoria, porcentagem }) => `${categoria}: ${porcentagem.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Detalhes por Categoria</h4>
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <div>
                      <div className="font-medium">{getCategoryLabel(cat.category as any)}</div>
                      <div className="text-sm text-muted-foreground">
                        {cat.count} transação(ões)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(cat.total)}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentage.toFixed(1)}% do total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

