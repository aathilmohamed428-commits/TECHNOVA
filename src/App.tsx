import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { CameraInspectionPage } from './pages/CameraInspectionPage';
import { InspectionDetailPage } from './pages/InspectionDetailPage';
import { InspectionHistoryPage } from './pages/InspectionHistoryPage';
import { ProductsPage } from './pages/ProductsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RulesPage } from './pages/RulesPage';
import { SettingsPage } from './pages/SettingsPage';
import { initializeSeedDataIfEmpty } from './services/seedData';
import { InspectionRecord } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);

  useEffect(() => {
    initializeSeedDataIfEmpty();
  }, []);

  const handleStartCameraInspection = () => {
    setSelectedInspection(null);
    setCurrentTab('camera');
  };

  const handleSelectInspectionDetail = (inspection: InspectionRecord) => {
    setSelectedInspection(inspection);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header onStartInspection={handleStartCameraInspection} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => {
          setSelectedInspection(null);
          setCurrentTab(tab);
        }} />

        <main className="flex-1 overflow-y-auto">
          {selectedInspection ? (
            <InspectionDetailPage
              inspection={selectedInspection}
              onBack={() => setSelectedInspection(null)}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardPage
              onStartInspection={handleStartCameraInspection}
              onSelectInspection={handleSelectInspectionDetail}
              onNavigateTab={setCurrentTab}
            />
          ) : currentTab === 'camera' ? (
            <CameraInspectionPage
              onCompleteInspection={(newInspection) => {
                setSelectedInspection(newInspection);
              }}
              onCancel={() => setCurrentTab('dashboard')}
            />
          ) : currentTab === 'history' ? (
            <InspectionHistoryPage
              onSelectInspection={handleSelectInspectionDetail}
              onStartNewInspection={handleStartCameraInspection}
            />
          ) : currentTab === 'products' ? (
            <ProductsPage />
          ) : currentTab === 'complaints' ? (
            <ComplaintsPage />
          ) : currentTab === 'analytics' ? (
            <AnalyticsPage />
          ) : currentTab === 'rules' ? (
            <RulesPage />
          ) : (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
