'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CSVUpload } from '@/components/CSVUpload'
import { ExportButton } from '@/components/ExportButton'
import { DashboardView } from '@/components/views/DashboardView'
import { DailyFlowView } from '@/components/views/DailyFlowView'
import { CategoryAnalysisView } from '@/components/views/CategoryAnalysisView'
import { AlertsView } from '@/components/views/AlertsView'
import { InsightsView } from '@/components/views/InsightsView'
import { ObjectivesView } from '@/components/views/ObjectivesView'
import { MotorView } from '@/components/views/MotorView'
import { LoadStorage } from '@/components/LoadStorage'
import { ThemeEnforcer } from '@/components/ThemeEnforcer'

export default function Home() {
  return (
    <main 
      className="min-h-screen bg-background text-foreground p-4 md:p-8"
      style={{
        backgroundColor: 'hsl(222.2, 84%, 4.9%)',
        color: 'hsl(210, 40%, 98%)'
      }}
    >
      <ThemeEnforcer />
      <LoadStorage />
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="border-b border-border pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: 'hsl(210, 40%, 98%)' }}>
                RAV4 Finance Control
              </h1>
              <p className="text-muted-foreground text-lg" style={{ color: 'hsl(215, 20.2%, 65.1%)' }}>
                Sala de Guerra Financeira - Controle Total do Seu Dinheiro
              </p>
            </div>
            <div className="pt-1">
              <ExportButton />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <CSVUpload />
        </div>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">🟥 Painel</TabsTrigger>
            <TabsTrigger value="daily">🟧 Fluxo</TabsTrigger>
            <TabsTrigger value="categories">🟨 Categorias</TabsTrigger>
            <TabsTrigger value="alerts">🟩 Alertas</TabsTrigger>
            <TabsTrigger value="insights">🟦 Insights</TabsTrigger>
            <TabsTrigger value="objectives">🟪 Objetivos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <DashboardView />
          </TabsContent>

          <TabsContent value="daily" className="mt-6">
            <DailyFlowView />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <CategoryAnalysisView />
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <AlertsView />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsView />
          </TabsContent>

          <TabsContent value="objectives" className="mt-6">
            <ObjectivesView />
          </TabsContent>
        </Tabs>
        
        {/* ABA OCULTA: Motor (só acessível via URL ou debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="hidden">
            <MotorView />
          </div>
        )}
      </div>
    </main>
  )
}
