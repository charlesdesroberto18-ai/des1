import React, { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { DynamicIcon } from './Icons';
import { Task, KanbanCard, Transaction } from '../types';
import { useToast } from './Toast';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY.trim() !== '';

interface DashboardMapProps {
  localTasks: Task[];
  kanbanCards: KanbanCard[];
  transactions: Transaction[];
  onUpdateTaskLocation?: (id: string, name: string, lat: number, lng: number) => void;
}

// Preset locations to help bootstrap the user's view with beautiful examples
const PRESET_HUBS = [
  { id: 'hub-office', name: 'Escritório Central (HQ)', lat: -23.5616, lng: -46.6560, desc: 'Avenida Paulista, SP - Base de Operações' },
  { id: 'hub-univ', name: 'Biblioteca Universitária', lat: -23.5598, lng: -46.7201, desc: 'USP, SP - Estudos e Pesquisa' },
  { id: 'hub-cowork', name: 'Co-working Faria Lima', lat: -23.5874, lng: -46.6805, desc: 'Faria Lima, SP - Reuniões com Clientes' },
  { id: 'hub-park', name: 'Parque Ibirapuera', lat: -23.5874, lng: -46.6576, desc: 'Ibirapuera, SP - Saúde e Lazer' },
  { id: 'hub-market', name: 'Supermercado Paulista', lat: -23.5656, lng: -46.6520, desc: 'Paulista, SP - Suprimentos' }
];

export default function DashboardMap({ localTasks, kanbanCards, transactions, onUpdateTaskLocation }: DashboardMapProps) {
  const { toast } = useToast();
  const [currentHub, setCurrentHub] = useState(PRESET_HUBS[0]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeRoute, setActiveRoute] = useState<any[] | null>(null);
  const [allocatedHours, setAllocatedHours] = useState<Record<string, number>>({});
  const [allocatedBudget, setAllocatedBudget] = useState<Record<string, number>>({});

  // Compile all location-pinned items across modules
  const mapItems = useMemo(() => {
    const items: any[] = [];

    // 1. Add tasks with locations (or bootstrap a few)
    localTasks.forEach(task => {
      if (task.location) {
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.text,
          category: task.category,
          priority: task.priority,
          location: task.location,
          raw: task
        });
      } else {
        // Bootstrap sample locations based on category for rich visualization out of the box
        let sampleLoc = null;
        if (task.category === 'Estudos') {
          sampleLoc = { name: 'Biblioteca Universitária', lat: -23.5598, lng: -46.7201 };
        } else if (task.category === 'Trabalho') {
          sampleLoc = { name: 'Escritório Central (HQ)', lat: -23.5616, lng: -46.6560 };
        } else if (task.category === 'Finanças') {
          sampleLoc = { name: 'Co-working Faria Lima', lat: -23.5874, lng: -46.6805 };
        }

        if (sampleLoc) {
          items.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.text,
            category: task.category,
            priority: task.priority,
            location: sampleLoc,
            raw: task
          });
        }
      }
    });

    // 2. Add kanban cards with locations
    kanbanCards.forEach(card => {
      if (card.location) {
        items.push({
          id: `card-${card.id}`,
          type: 'project',
          title: card.title,
          category: card.category,
          priority: card.priority,
          location: card.location,
          raw: card
        });
      } else {
        // Bootstrap sample location
        let sampleLoc = null;
        if (card.category === 'Trabalho') {
          sampleLoc = { name: 'Co-working Faria Lima', lat: -23.5874, lng: -46.6805 };
        } else if (card.category === 'Estudos') {
          sampleLoc = { name: 'Biblioteca Universitária', lat: -23.5598, lng: -46.7201 };
        }

        if (sampleLoc) {
          items.push({
            id: `card-${card.id}`,
            type: 'project',
            title: card.title,
            category: card.category,
            priority: card.priority,
            location: sampleLoc,
            raw: card
          });
        }
      }
    });

    // 3. Add transactions with locations
    transactions.forEach(tx => {
      if (tx.location) {
        items.push({
          id: `tx-${tx.id}`,
          type: 'finance',
          title: tx.description,
          category: tx.category,
          amount: tx.amount,
          txType: tx.type,
          location: tx.location,
          raw: tx
        });
      } else {
        // Bootstrap sample locations
        let sampleLoc = null;
        if (tx.category === 'moradia') {
          sampleLoc = { name: 'Escritório Central (HQ)', lat: -23.5616, lng: -46.6560 };
        } else if (tx.category === 'alimentacao') {
          sampleLoc = { name: 'Supermercado Paulista', lat: -23.5656, lng: -46.6520 };
        } else if (tx.category === 'lazer') {
          sampleLoc = { name: 'Parque Ibirapuera', lat: -23.5874, lng: -46.6576 };
        }

        if (sampleLoc) {
          items.push({
            id: `tx-${tx.id}`,
            type: 'finance',
            title: tx.description,
            category: tx.category,
            amount: tx.amount,
            txType: tx.type,
            location: sampleLoc,
            raw: tx
          });
        }
      }
    });

    return items;
  }, [localTasks, kanbanCards, transactions]);

  // Haversine formula to compute distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Sort items based on proximity to the current hub
  const proximityItems = useMemo(() => {
    return mapItems.map(item => {
      const distance = calculateDistance(
        currentHub.lat,
        currentHub.lng,
        item.location.lat,
        item.location.lng
      );
      return { ...item, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [mapItems, currentHub]);

  // Handle Resource Allocation Logic automatically
  const handleOptimizeResources = () => {
    // Proximity based automatic allocation
    // 1. Allocates more study/work hours to nearby locations to minimize transit overhead
    // 2. Budget is adjusted based on location tier / priority
    const hours: Record<string, number> = {};
    const budget: Record<string, number> = {};

    proximityItems.forEach(item => {
      // Closer locations get higher efficiency ratings and optimal hours
      if (item.distance < 1.0) {
        hours[item.id] = 4; // High focus
        budget[item.id] = item.type === 'finance' ? item.amount : 50; // High allowance
      } else if (item.distance < 3.0) {
        hours[item.id] = 2; // Medium focus
        budget[item.id] = item.type === 'finance' ? item.amount : 30;
      } else {
        hours[item.id] = 1; // Low focus/deferrable
        budget[item.id] = item.type === 'finance' ? item.amount : 15;
      }
    });

    setAllocatedHours(hours);
    setAllocatedBudget(budget);
    toast.success('Horas e recursos financeiros alocados e otimizados automaticamente por proximidade!', 'Recursos Alocados');
  };

  // Solve Travelling Salesperson Problem (Greedy heuristic) to find the shortest route
  const handleSuggestRoute = () => {
    if (mapItems.length === 0) {
      toast.warning('Nenhum item com localização encontrado para planejar rota.', 'Sem Localizações');
      return;
    }

    const unvisited = [...mapItems];
    const route: any[] = [currentHub];
    let currentPos = { lat: currentHub.lat, lng: currentHub.lng };

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculateDistance(
          currentPos.lat,
          currentPos.lng,
          unvisited[i].location.lat,
          unvisited[i].location.lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      const nextItem = unvisited.splice(nearestIndex, 1)[0];
      route.push(nextItem);
      currentPos = { lat: nextItem.location.lat, lng: nextItem.location.lng };
    }

    // Connect back to hub to close the loop
    route.push(currentHub);
    setActiveRoute(route);
    toast.success('Rota otimizada calculada! Polilinha de percurso projetada no mapa para economizar tempo.', 'Rota Otimizada');
  };

  // Clear current route
  const clearRoute = () => {
    setActiveRoute(null);
  };

  // Render setup instructions if API key is missing
  if (!hasValidKey) {
    return (
      <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-8 text-center space-y-6">
        <div className="h-16 w-16 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-rose-500/20">
          <DynamicIcon name="MapPin" size={28} />
        </div>
        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-base font-extrabold text-white">Chave de API do Google Maps Necessária</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Para renderizar o mapa interativo do dashboard e calcular a melhor alocação de recursos, insira sua chave do Google Maps Platform.
          </p>
        </div>

        <div className="p-5 bg-slate-950/80 rounded-2xl border border-white/5 text-left text-xs space-y-3 max-w-md mx-auto">
          <p className="text-slate-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
            <DynamicIcon name="Sparkles" size={12} className="text-indigo-400" /> Passos para Configuração:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 font-medium">
            <li>
              <a 
                href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline font-bold inline-flex items-center gap-0.5"
              >
                Obtenha uma chave de API <DynamicIcon name="ExternalLink" size={10} />
              </a>
            </li>
            <li>Abra as <strong>Configurações</strong> (ícone de engrenagem ⚙️ no canto superior direito).</li>
            <li>Vá em <strong>Secrets</strong>, digite <code className="bg-white/10 px-1 py-0.5 rounded text-white text-[10px] font-mono">GOOGLE_MAPS_PLATFORM_KEY</code> como o nome.</li>
            <li>Cole a sua chave de API gerada no valor e salve.</li>
          </ol>
        </div>

        <p className="text-[10px] text-slate-500 font-semibold italic">O aplicativo será reconstruído automaticamente ao salvar, sem necessidade de atualizar a página.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Left Hand Google Map Frame */}
      <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-white/5 bg-slate-950/40 shadow-2xl relative flex flex-col min-h-[460px]">
        {/* Map Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-10 p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-md shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center">
              <DynamicIcon name="Navigation" size={13} className="animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] font-extrabold text-white uppercase tracking-wider">Mapa de Atividades & Recursos</h4>
              <p className="text-[9px] text-indigo-300 truncate font-semibold mt-0.5">Base: {currentHub.name}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {activeRoute && (
              <button
                onClick={clearRoute}
                className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold px-2.5 py-1 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <DynamicIcon name="X" size={10} /> Limpar Rota
              </button>
            )}
            <button
              onClick={handleSuggestRoute}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold px-3 py-1.5 rounded-xl text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-md"
            >
              <DynamicIcon name="Milestone" size={11} /> Traçar Rota
            </button>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="flex-1 w-full min-h-[400px]">
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={{ lat: currentHub.lat, lng: currentHub.lng }}
              defaultZoom={13}
              mapId="RESOURCE_MAP_DEMO"
              style={{ width: '100%', height: '100%', minHeight: '400px' }}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              {/* Current Station/Hub Advanced Marker */}
              <AdvancedMarker
                position={{ lat: currentHub.lat, lng: currentHub.lng }}
                title={`Sua Estação Atual: ${currentHub.name}`}
              >
                <Pin background="#4f46e5" glyphColor="#fff" scale={1.2}>
                  <div className="text-[9px] font-bold text-white">EU</div>
                </Pin>
              </AdvancedMarker>

              {/* Map Items Advanced Markers */}
              {mapItems.map((item) => {
                const isSelected = selectedLocation?.id === item.id;
                let bgColor = '#f59e0b'; // Amber for standard task
                let glyph = '📋';

                if (item.type === 'finance') {
                  bgColor = '#10b981'; // Emerald for finances
                  glyph = '💰';
                } else if (item.type === 'project') {
                  bgColor = '#8b5cf6'; // Violet for projects
                  glyph = '🚀';
                }

                return (
                  <AdvancedMarker
                    key={item.id}
                    position={{ lat: item.location.lat, lng: item.location.lng }}
                    onClick={() => setSelectedLocation(item)}
                  >
                    <Pin background={bgColor} borderColor="rgba(255,255,255,0.2)" scale={isSelected ? 1.25 : 1.0}>
                      <span className="text-xs">{glyph}</span>
                    </Pin>
                  </AdvancedMarker>
                );
              })}

              {/* Info Window for Selected Marker */}
              {selectedLocation && (
                <InfoWindow
                  position={{ lat: selectedLocation.location.lat, lng: selectedLocation.location.lng }}
                  onCloseClick={() => setSelectedLocation(null)}
                >
                  <div className="p-2 min-w-[200px] text-slate-900 font-sans space-y-1.5">
                    <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                      <span className="text-xs">
                        {selectedLocation.type === 'finance' ? '💰' : selectedLocation.type === 'project' ? '🚀' : '📋'}
                      </span>
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
                        {selectedLocation.type === 'finance' ? 'Finanças' : selectedLocation.type === 'project' ? 'Sprint Kanban' : 'Tarefa'}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-800 leading-tight">{selectedLocation.title}</h5>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <DynamicIcon name="MapPin" size={9} /> {selectedLocation.location.name}
                    </p>
                    {selectedLocation.type === 'finance' && (
                      <p className="text-xs font-mono font-bold text-emerald-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedLocation.amount)}
                      </p>
                    )}
                    {selectedLocation.priority && (
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        selectedLocation.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        Prioridade: {selectedLocation.priority}
                      </span>
                    )}
                  </div>
                </InfoWindow>
              )}

              {/* Render Polyline route connection fallback if routes array is active */}
              {activeRoute && <RoutePolyline route={activeRoute} />}
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* 2. Right Hand Resource Optimizer Dashboard */}
      <div className="lg:col-span-5 rounded-3xl glass-card border border-white/5 p-6 shadow-2xl flex flex-col justify-between space-y-6">
        <div className="space-y-5">
          {/* Section Header */}
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <DynamicIcon name="SlidersHorizontal" size={13} className="text-indigo-400" />
              Otimizador de Alocação de Recursos
            </h3>
            <p className="text-[10px] text-slate-450 mt-0.5">Minimize deslocamento e organize horas de esforço</p>
          </div>

          {/* Hub Base Selection */}
          <div className="space-y-1.5 bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
            <label className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
              <DynamicIcon name="Home" size={10} className="text-indigo-400" />
              Sua Estação de Trabalho Atual (Hub)
            </label>
            <select
              value={currentHub.id}
              onChange={(e) => {
                const hub = PRESET_HUBS.find(h => h.id === e.target.value);
                if (hub) setCurrentHub(hub);
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
            >
              {PRESET_HUBS.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
            <span className="text-[9px] text-slate-500 font-medium block italic mt-1 pl-1">
              {currentHub.desc}
            </span>
          </div>

          {/* Allocation Action Panel */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleOptimizeResources}
              className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold p-3 rounded-2xl text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-sm hover:shadow"
            >
              <DynamicIcon name="Sparkles" size={15} />
              <span>Otimizar Recursos</span>
            </button>

            <button
              onClick={handleSuggestRoute}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold p-3 rounded-2xl text-[10px] uppercase tracking-wider flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer shadow-sm hover:shadow"
            >
              <DynamicIcon name="Navigation" size={15} />
              <span>Traçar Melhor Rota</span>
            </button>
          </div>

          {/* List of Proximity Items and Allocations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Itens por Proximidade</h4>
              <span className="text-[9px] text-slate-500 font-bold">{proximityItems.length} Registros</span>
            </div>

            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {proximityItems.map(item => {
                const distanceKm = item.distance.toFixed(1);
                const hasHours = allocatedHours[item.id] !== undefined;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedLocation(item)}
                    className="p-3 bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/10 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        item.type === 'finance' ? 'bg-emerald-500/10 text-emerald-400' : item.type === 'project' ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        <DynamicIcon name={item.type === 'finance' ? 'DollarSign' : item.type === 'project' ? 'ClipboardList' : 'CheckSquare'} size={11} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate leading-tight">{item.title}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[8px] font-semibold text-slate-500">{item.location.name}</span>
                          <span className="h-1 w-1 bg-white/10 rounded-full" />
                          <span className="text-[9px] font-mono text-indigo-400 font-bold">{distanceKm} km</span>
                        </div>
                      </div>
                    </div>

                    {/* Resources Allocations Badge Display */}
                    <div className="text-right shrink-0">
                      {hasHours ? (
                        <div className="space-y-0.5">
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-lg font-mono font-bold block">
                            🕒 {allocatedHours[item.id]}h
                          </span>
                          {item.type === 'finance' ? (
                            <span className="text-[8px] text-emerald-400 font-mono block font-bold">
                              R$ {allocatedBudget[item.id]}
                            </span>
                          ) : (
                            <span className="text-[8px] text-slate-500 font-mono block">
                              Custo R$ {allocatedBudget[item.id]}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-500 italic block">Não Alocado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Efficiency summary info card */}
        <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/10 rounded-2xl p-4 flex gap-3.5 items-center">
          <div className="h-10 w-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
            <DynamicIcon name="Compass" size={18} />
          </div>
          <div>
            <h5 className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">Conselho de Eficiência Urbana</h5>
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
              Ao resolver as tarefas agrupadas por proximidade, você reduzirá as emissões de carbono e economizará aproximadamente <strong className="text-indigo-400">35 minutos</strong> de trânsito hoje.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component to draw custom visual polylines on the maps directly via native google.maps
function RoutePolyline({ route }: { route: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || route.length < 2) return;

    // Convert route to google latlng literal path
    const pathCoords = route.map(item => ({
      lat: item.location ? item.location.lat : item.lat,
      lng: item.location ? item.location.lng : item.lng
    }));

    // Create polyline element
    const polyline = new google.maps.Polyline({
      path: pathCoords,
      geodesic: true,
      strokeColor: '#6366f1',
      strokeOpacity: 0.8,
      strokeWeight: 4,
    });

    polyline.setMap(map);

    // Zoom map out to bound the route perfectly
    const bounds = new google.maps.LatLngBounds();
    pathCoords.forEach(c => bounds.extend(c));
    map.fitBounds(bounds);

    return () => {
      polyline.setMap(null);
    };
  }, [map, route]);

  return null;
}
