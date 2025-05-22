import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import { format, startOfMonth, endOfMonth, isSameMonth, isToday, isSameDay, startOfWeek, addDays } from 'date-fns';
import { enUS, lv } from 'date-fns/locale';

const Calendar = () => {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeader, darkMode } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const dateLocale = i18n.language === 'lv' ? lv : enUS;

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      return savedState === 'true';
    }
    return window.innerWidth < 768;
  });

  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch reminders from vehicles
      const remindersResponse = await fetch(`${apiUrl}/api/vehicles`, {
        headers: getAuthHeader()
      });
      if (!remindersResponse.ok) {
        throw new Error('Failed to fetch reminders');
      }
      const vehiclesData = await remindersResponse.json();
      const reminders = [];
      vehiclesData.forEach(vehicle => {
        if (vehicle.reminders && vehicle.reminders.length > 0) {
          vehicle.reminders.forEach(reminder => {
            if (reminder.enabled) {
              reminders.push({
                id: reminder.id,
                title: reminder.name,
                date: new Date(reminder.date),
                type: 'reminder',
                vehicle: {
                  id: vehicle.id,
                  make: vehicle.make,
                  model: vehicle.model
                }
              });
            }
          });
        }
      });

      // Fetch service history records directly
      const serviceHistoryResponse = await fetch(`${apiUrl}/api/service-history`, {
        headers: getAuthHeader()
      });
      if (!serviceHistoryResponse.ok) {
        throw new Error('Failed to fetch service history');
      }
      const serviceHistoryData = await serviceHistoryResponse.json();
      const serviceLogs = serviceHistoryData.map(service => ({
        id: `service-${service.id}`,
        title: service.service_type || t('service.serviceHistory'),
        date: new Date(service.service_date),
        type: 'service',
        vehicle: {
          id: service.vehicle_id,
          make: service.make,
          model: service.model
        },
        description: service.notes || '',
        cost: service.cost
      }));

      // Combine and sort all events (reminders + service logs)
      const allEvents = [...reminders, ...serviceLogs].sort((a, b) => a.date - b.date);
      setEvents(allEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(t('common.errorLoadingEvents'));
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    // Start from Monday
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfMonth(currentDate);
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    // Fill up to complete weeks (end on Sunday)
    while (days.length % 7 !== 0) {
      days.push(addDays(days[days.length - 1], 1));
    }
    return days;
  };

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Map known reminder names to translation keys
  const reminderTitleToKey = {
    'Insurance Renewal': 'vehicles.reminders.insuranceRenewal',
    'insuranceRenewal': 'vehicles.reminders.insuranceRenewal',
    'Road Worthiness Certificate': 'vehicles.reminders.roadWorthinessCertificate',
    'roadWorthinessCertificate': 'vehicles.reminders.roadWorthinessCertificate',
    'Service Due': 'vehicles.reminders.serviceDue',
    'serviceDue': 'vehicles.reminders.serviceDue',
    // Add more mappings as needed
  };

  // Map known service types to translation keys
  const serviceTypeToKey = {
    'Oil Change': 'service.types.oilChange',
    'Tire Rotation': 'service.types.tireRotation',
    'Brake Service': 'service.types.brakeService',
    'Engine Service': 'service.types.engineService',
    'Transmission Service': 'service.types.transmissionService',
    'Battery Replacement': 'service.types.batteryReplacement',
    'Air Filter Replacement': 'service.types.airFilterReplacement',
    'Fluid Service': 'service.types.fluidService',
    'Inspection': 'service.types.inspection',
    'Insurance Renewal': 'service.types.insuranceRenewal',
    'insuranceRenewal': 'service.types.insuranceRenewal',
    'Road Worthiness Certificate': 'service.types.roadWorthinessCertificate',
    'roadWorthinessCertificate': 'service.types.roadWorthinessCertificate',
    'Service Due': 'vehicles.reminders.serviceDue',
    'serviceDue': 'vehicles.reminders.serviceDue',
    'Fuel': 'service.types.fuel',
    'Refueling': 'service.types.refueling',
    'Other': 'service.types.other',
    'Spark Plugs Replacement': 'service.types.sparkPlugReplacement',
    'Wheel Alignment': 'service.types.wheelAlignment',
    'Brake Inspection': 'service.types.brakeInspection',
    'Coolant Flush': 'service.types.coolantFlush',
    'Engine Tune-up': 'service.types.engineTuneUp',
    // Add more mappings as needed
  };

  // Helper to get translated event title
  const getNotificationTitle = (event) => {
    if (event.type === 'reminder' && reminderTitleToKey[event.title]) {
      return t(reminderTitleToKey[event.title]);
    }
    if (event.type === 'service' && serviceTypeToKey[event.title]) {
      return t(serviceTypeToKey[event.title]);
    }
    return event.title || t(`common.eventTypes.${event.type}`);
  };

  const renderCalendarGrid = () => {
    const days = getDaysInMonth();
    // Monday as first day
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {day}
          </div>
        ))}
        {/* Calendar days */}
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`p-2 border border-gray-200 dark:border-gray-700 min-h-[100px] rounded transition-colors duration-200 ${
                !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-800 opacity-60' : 'bg-white dark:bg-gray-900'
              } ${isCurrentDay ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
            >
              <div className="font-semibold mb-1 text-gray-900 dark:text-gray-100">{format(day, 'd')}</div>
              <div className="space-y-1">
                {dayEvents.length === 0 && (
                  <div className="text-xs text-gray-400 dark:text-gray-600">{t('common.noEvents')}</div>
                )}
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded flex flex-col gap-0.5 truncate shadow-sm transition-colors duration-200
                      ${event.type === 'reminder'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700'
                        : event.type === 'service'
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                          : ''}
                    `}
                    title={
                      [
                        getNotificationTitle(event),
                        event.vehicle && (event.vehicle.id || event.vehicle.make || event.vehicle.model)
                          ? `${event.vehicle.id ? event.vehicle.id + ' ' : ''}${event.vehicle.make || ''} ${event.vehicle.model || ''}`
                          : '',
                        event.description || ''
                      ].filter(Boolean).join('\n')
                    }
                    style={{ cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                    onMouseEnter={e => {
                      if (e.target.scrollWidth > e.target.clientWidth) {
                        e.target.style.whiteSpace = 'normal';
                        e.target.style.zIndex = 10;
                        e.target.style.position = 'relative';
                        e.target.style.background = 'rgba(0,0,0,0.8)';
                        e.target.style.color = '#fff';
                        e.target.style.padding = '8px';
                        e.target.style.borderRadius = '6px';
                        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.target.style.whiteSpace = 'nowrap';
                      e.target.style.zIndex = '';
                      e.target.style.position = '';
                      e.target.style.background = '';
                      e.target.style.color = '';
                      e.target.style.padding = '';
                      e.target.style.borderRadius = '';
                      e.target.style.boxShadow = '';
                    }}
                  >
                    <span className="truncate font-semibold">{getNotificationTitle(event)}</span>
                    <span className="truncate text-xs text-gray-600 dark:text-gray-300">
                      {event.vehicle && (
                        <>
                          {event.vehicle.id ? `${event.vehicle.id} ` : ''}
                          {event.vehicle.make || ''} {event.vehicle.model || ''}
                        </>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Adjust left margin based on sidebar state
  const mainMarginLeft = sidebarCollapsed ? '4rem' : '16rem';

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-700 dark:text-gray-300">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Error Loading Calendar</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6"
          style={{ marginTop: '4rem', marginLeft: mainMarginLeft }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {format(currentDate, 'MMMM yyyy', { locale: dateLocale })}
                </h1>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                  >
                    {t('common.previous')}
                  </button>
                  <button
                    onClick={goToToday}
                    className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                  >
                    {t('common.today')}
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700"
                  >
                    {t('common.next')}
                  </button>
                </div>
              </div>
              {renderCalendarGrid()}
              {/* Legend below calendar */}
              <div className="mt-6 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded bg-yellow-100 border border-yellow-200 dark:bg-yellow-900 dark:border-yellow-700"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.eventTypes.reminder')} </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded bg-green-100 border border-green-200 dark:bg-green-900 dark:border-green-700"></span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{t('common.eventTypes.service')} </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Calendar; 