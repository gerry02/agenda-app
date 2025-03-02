import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, User, Phone, Clock, ChevronRight, Map, Plus, Search, Trash2, Save, Edit, X } from 'lucide-react';
import { GeoapifyGeocoderAutocomplete, GeoapifyContext } from '@geoapify/react-geocoder-autocomplete';
import '@geoapify/geocoder-autocomplete/styles/minimal.css';

// Dati di esempio
const initialContacts = [
  { id: 1, name: 'Marco Rossi', phone: '333-1234567', address: 'Via Roma 123, Milano', notes: 'Preferisce incontri mattutini', coordinates: { lat: 45.4642, lon: 9.1900 } },
  { id: 2, name: 'Laura Bianchi', phone: '333-7654321', address: 'Via Garibaldi 45, Milano', notes: 'Interessata a nuovi prodotti', coordinates: { lat: 45.4654, lon: 9.1859 } },
  { id: 3, name: 'Giovanni Verdi', phone: '333-1122334', address: 'Corso Italia 78, Milano', notes: 'Cliente premium', coordinates: { lat: 45.4660, lon: 9.1870 } }
];

const initialAppointments = [
  { id: 1, contactId: 1, date: '2025-02-27', time: '09:00', duration: 60, notes: 'Presentazione nuovo catalogo' },
  { id: 2, contactId: 2, date: '2025-02-27', time: '14:00', duration: 45, notes: 'Rinnovo contratto' },
  { id: 3, contactId: 3, date: '2025-02-28', time: '11:00', duration: 30, notes: 'Follow-up vendita' }
];

const SalesAgendaApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState(() => {
    const savedContacts = localStorage.getItem("contacts");
    return savedContacts ? JSON.parse(savedContacts) : initialContacts;
  });
  const [appointments, setAppointments] = useState(() => {
    const savedAppointments = localStorage.getItem("appointments");
    return savedAppointments ? JSON.parse(savedAppointments) : initialAppointments;
  });
  
  const [selectedDate, setSelectedDate] = useState('2025-02-27');
  const [showContactForm, setShowContactForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [contactToEdit, setContactToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '', address: '', notes: '', coordinates: null });
  const [newAppointment, setNewAppointment] = useState({ contactId: '', date: selectedDate, time: '', duration: 60, notes: '' });
  const [routeStats, setRouteStats] = useState({ distance: 0, duration: 0 }); // distanza in km, durata in min

  // Salvataggio automatico dei dati
  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem("appointments", JSON.stringify(appointments));
  }, [appointments]);

  // Filtra i contatti
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone.includes(searchTerm) ||
    contact.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ottieni gli appuntamenti per la data selezionata
  const getDailyAppointments = (date) => {
    return appointments
      .filter(appointment => appointment.date === date)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  // Ottieni il nome del contatto
  const getContactName = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : 'Contatto sconosciuto';
  };

  // Aggiungi un nuovo contatto (salvando anche le coordinate se disponibili)
  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      const contact = {
        id: contacts.length + 1,
        ...newContact
      };
      setContacts([...contacts, contact]);
      setNewContact({ name: '', phone: '', address: '', notes: '', coordinates: null });
      setShowContactForm(false);
    }
  };

  // Aggiorna un contatto esistente
  const handleUpdateContact = () => {
    setContacts(contacts.map(c => c.id === contactToEdit.id ? contactToEdit : c));
    setContactToEdit(null);
  };

  // Aggiungi un nuovo appuntamento
  const handleAddAppointment = () => {
    if (newAppointment.contactId && newAppointment.date && newAppointment.time) {
      const appointment = {
        id: appointments.length + 1,
        ...newAppointment
      };
      setAppointments([...appointments, appointment]);
      setNewAppointment({ contactId: '', date: selectedDate, time: '', duration: 60, notes: '' });
      setShowAppointmentForm(false);
    }
  };

  // Elimina un contatto (e i relativi appuntamenti)
  const handleDeleteContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
    setAppointments(appointments.filter(appointment => appointment.contactId !== id));
  };

  // Elimina un appuntamento
  const handleDeleteAppointment = (id) => {
    setAppointments(appointments.filter(appointment => appointment.id !== id));
  };

  // Ottimizza il percorso: restituisce gli appuntamenti con coordinate
  const optimizeRoute = () => {
    const dailyAppointments = getDailyAppointments(selectedDate);
    return dailyAppointments.map(appointment => {
      const contact = contacts.find(c => c.id === appointment.contactId);
      return {
        ...appointment,
        address: contact ? contact.address : '',
        contactName: contact ? contact.name : 'Contatto sconosciuto',
        coordinates: contact && contact.coordinates ? contact.coordinates : null,
      };
    });
  };

  // Calcola statistiche di percorso utilizzando il Geoapify Distance Matrix API
useEffect(() => {
  if (activeTab !== 'route') return;
  const stops = optimizeRoute().filter(stop => stop.coordinates);
  if (stops.length < 2) {
    setRouteStats({ distance: 0, duration: 0 });
    return;
  }
  // Per ogni coppia consecutiva:
  // "sources" sono tutte le tappe tranne l'ultima,
  // "targets" sono tutte le tappe tranne la prima.
  const sources = stops.slice(0, stops.length - 1).map(stop => ({ location: [stop.coordinates.lon, stop.coordinates.lat] }));
  const targets = stops.slice(1).map(stop => ({ location: [stop.coordinates.lon, stop.coordinates.lat] }));
  const body = {
    mode: "drive",
    sources,
    targets
  };
  fetch(`https://api.geoapify.com/v1/routematrix?apiKey=280867f72de74c91b53b9708b9b24b17`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data && data.results && data.results.length > 0) {
        let totalDistance = 0;
        let totalDuration = 0;
        // I risultati sono in ordine: ogni elemento corrisponde al percorso da sources[i] a targets[i]
        data.results.forEach(result => {
          if (result && result.distance && result.duration) {
            totalDistance += result.distance;
            totalDuration += result.duration;
          }
        });
        setRouteStats({ 
          distance: (totalDistance / 1000).toFixed(1), // km
          duration: Math.round(totalDuration / 60)      // min
        });
      }
    })
    .catch(err => {
      console.error("Route Matrix API error:", err);
      setRouteStats({ distance: 0, duration: 0 });
    });
}, [activeTab, contacts, appointments, selectedDate]);

  // Definisco "route" per il rendering e per aprire Google Maps
  const route = optimizeRoute();

  // Apertura del percorso completo in Google Maps (usando indirizzi)
  const handleOpenRoute = () => {
    if (route.length === 0) return;
    const destinationAddress = route[route.length - 1].address;
    const waypointAddresses = route.length > 1 
      ? route.slice(0, route.length - 1).map(stop => stop.address).join('|')
      : '';
    const url = waypointAddresses 
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}&waypoints=${encodeURIComponent(waypointAddresses)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`;
    window.open(url, '_blank');
  };

  // Apertura in Google Maps per un singolo indirizzo
  const openInMaps = (address) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <GeoapifyContext apiKey="280867f72de74c91b53b9708b9b24b17">
      <div className="flex flex-col h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-blue-600 text-white p-4">
          <h1 className="text-2xl font-bold">Agenda Venditori</h1>
        </header>
        
        {/* Navigazione per desktop */}
        <nav className="hidden md:block bg-blue-500 text-white px-4">
          <ul className="flex space-x-2">
            <li className={`py-2 px-3 cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-700 rounded' : ''}`} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </li>
            <li className={`py-2 px-3 cursor-pointer ${activeTab === 'contacts' ? 'bg-blue-700 rounded' : ''}`} onClick={() => setActiveTab('contacts')}>
              Contatti
            </li>
            <li className={`py-2 px-3 cursor-pointer ${activeTab === 'calendar' ? 'bg-blue-700 rounded' : ''}`} onClick={() => setActiveTab('calendar')}>
              Calendario
            </li>
            <li className={`py-2 px-3 cursor-pointer ${activeTab === 'route' ? 'bg-blue-700 rounded' : ''}`} onClick={() => setActiveTab('route')}>
              Percorsi
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 overflow-auto mb-16">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <Calendar className="mr-2" size={20} /> Appuntamenti di Oggi
                  </h2>
                  <div className="flex items-center">
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      className="border p-1 rounded mr-2"
                    />
                    <button 
                      className="bg-blue-500 text-white p-2 rounded"
                      onClick={() => {
                        setShowAppointmentForm(true);
                        setNewAppointment({ ...newAppointment, date: selectedDate });
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <ul className="divide-y">
                  {getDailyAppointments(selectedDate).length > 0 ? (
                    getDailyAppointments(selectedDate).map((appointment) => (
                      <li key={appointment.id} className="py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{getContactName(appointment.contactId)}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock size={14} className="mr-1" /> {appointment.time} ({appointment.duration} min)
                            </p>
                            {appointment.notes && <p className="text-sm italic">{appointment.notes}</p>}
                          </div>
                          <div className="flex items-center">
                            <button className="text-red-500 mr-2" onClick={() => handleDeleteAppointment(appointment.id)}>
                              <Trash2 size={16} />
                            </button>
                            <button className="text-gray-500" onClick={() => {
                              const contact = contacts.find(c => c.id === appointment.contactId);
                              if (contact) openInMaps(contact.address);
                            }}>
                              <MapPin size={16} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 py-2">Nessun appuntamento programmato per questa data</p>
                  )}
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <User className="mr-2" size={20} /> Contatti Recenti
                  </h2>
                  <button 
                    className="bg-blue-500 text-white p-2 rounded"
                    onClick={() => setShowContactForm(true)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <ul className="divide-y">
                  {contacts.slice(0, 5).map((contact, index) => (
                    <li key={`${contact.id}-${index}`} className="py-2">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold">{contact.name}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone size={14} className="mr-1" /> {contact.phone}
                          </p>
                        </div>
                        <div className="flex items-center">
                          {/* Pulsante per modificare il contatto */}
                          <button className="text-blue-500 mr-2" onClick={() => setContactToEdit(contact)}>
                            <Edit size={16} />
                          </button>
                          <button className="text-blue-500 mr-2" onClick={() => {
                            setShowAppointmentForm(true);
                            setNewAppointment({ ...newAppointment, contactId: contact.id });
                          }}>
                            <Calendar size={16} />
                          </button>
                          <button className="text-green-500 mr-2" onClick={() => openInMaps(contact.address)}>
                            <MapPin size={16} />
                          </button>
                          <button className="text-red-500" onClick={() => handleDeleteContact(contact.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <button 
                  className="mt-2 text-blue-500 text-sm flex items-center"
                  onClick={() => setActiveTab('contacts')}
                >
                  Visualizza tutti <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
          
          {/* Rubrica Contatti */}
          {activeTab === 'contacts' && (
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Rubrica Contatti</h2>
                <div className="flex">
                  <div className="relative mr-2">
                    <input 
                      type="text" 
                      placeholder="Cerca contatti..." 
                      className="border p-2 pl-8 rounded w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                  </div>
                  <button 
                    className="bg-blue-500 text-white p-2 rounded"
                    onClick={() => setShowContactForm(true)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left py-2 px-3">Nome</th>
                      <th className="text-left py-2 px-3">Telefono</th>
                      <th className="text-left py-2 px-3">Indirizzo</th>
                      <th className="text-left py-2 px-3">Note</th>
                      <th className="text-right py-2 px-3">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact, index) => (
                      <tr key={`${contact.id}-${index}`} className="border-t">
                        <td className="py-2 px-3">{contact.name}</td>
                        <td className="py-2 px-3">{contact.phone}</td>
                        <td className="py-2 px-3">{contact.address}</td>
                        <td className="py-2 px-3 text-sm italic">{contact.notes}</td>
                        <td className="py-2 px-3 text-right">
                          <button className="text-blue-500 mr-2" onClick={() => setContactToEdit(contact)}>
                            <Edit size={16} />
                          </button>
                          <button className="text-green-500 mr-2" onClick={() => openInMaps(contact.address)}>
                            <MapPin size={16} />
                          </button>
                          <button className="text-red-500" onClick={() => handleDeleteContact(contact.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredContacts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-500">Nessun contatto trovato</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* Calendario Appuntamenti */}
          {activeTab === 'calendar' && (
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Calendario Appuntamenti</h2>
                <div className="flex items-center">
                  <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="border p-1 rounded mr-2"
                  />
                  <button 
                    className="bg-blue-500 text-white p-2 rounded"
                    onClick={() => {
                      setShowAppointmentForm(true);
                      setNewAppointment({ ...newAppointment, date: selectedDate });
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto">
                {[...Array(7)].map((_, i) => {
                  const date = new Date(selectedDate);
                  date.setDate(date.getDate() - date.getDay() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayAppointments = appointments.filter(a => a.date === dateStr);
                  
                  return (
                    <div key={i} className={`min-w-[100px] p-2 border rounded ${dateStr === selectedDate ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => setSelectedDate(dateStr)}>
                      <div className="font-semibold mb-1">
                        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'][date.getDay()]} {date.getDate()}
                      </div>
                      {dayAppointments.map(appointment => (
                        <div key={appointment.id} className="mb-1 p-1 bg-blue-100 rounded text-sm">
                          <div className="font-semibold text-xs">{appointment.time}</div>
                          <div>{getContactName(appointment.contactId)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Dettaglio appuntamenti del {new Date(selectedDate).toLocaleDateString('it-IT')}</h3>
                <ul className="divide-y">
                  {getDailyAppointments(selectedDate).length > 0 ? (
                    getDailyAppointments(selectedDate).map((appointment) => (
                      <li key={appointment.id} className="py-2">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-semibold">{getContactName(appointment.contactId)}</p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock size={14} className="mr-1" /> {appointment.time} ({appointment.duration} min)
                            </p>
                            {appointment.notes && <p className="text-sm italic">{appointment.notes}</p>}
                          </div>
                          <div className="flex items-center">
                            <button className="text-red-500 mr-2" onClick={() => handleDeleteAppointment(appointment.id)}>
                              <Trash2 size={16} />
                            </button>
                            <button className="text-gray-500" onClick={() => {
                              const contact = contacts.find(c => c.id === appointment.contactId);
                              if (contact) openInMaps(contact.address);
                            }}>
                              <MapPin size={16} />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))
                  ) : (
                    <p className="text-gray-500 py-2">Nessun appuntamento programmato per questa data</p>
                  )}
                </ul>
              </div>
            </div>
          )}
          
          {/* Ottimizzazione Percorso */}
          {activeTab === 'route' && (
            <div className="bg-white p-4 rounded shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Ottimizzazione Percorso</h2>
                <div className="flex items-center">
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border p-1 rounded mr-2" />
                  <button className="bg-blue-500 text-white p-2 rounded">
                    <Map size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mb-4 p-4 bg-gray-100 rounded">
                <h3 className="font-semibold mb-2">Percorso ottimizzato per il {new Date(selectedDate).toLocaleDateString('it-IT')}</h3>
                {route.length > 0 ? (
                  <div>
                    <ul className="mb-4">
                      {route.map((stop, index) => (
                        <li key={`${stop.id}-${index}`} className="mb-2 flex items-start">
                          <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{stop.contactName}</p>
                            <p className="text-sm">{stop.time} - {stop.address}</p>
                            <div className="flex mt-1">
                              <button className="text-blue-500 text-sm mr-3 flex items-center" onClick={() => openInMaps(stop.address)}>
                                <MapPin size={14} className="mr-1" /> Naviga
                              </button>
                              <button className="text-gray-500 text-sm flex items-center">
                                <Phone size={14} className="mr-1" /> Chiama
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <button className="bg-green-500 text-white py-2 px-4 rounded flex items-center" onClick={handleOpenRoute}>
                      <Map size={16} className="mr-2" /> Apri percorso completo in Google Maps
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500">Nessun appuntamento programmato per questa data</p>
                )}
              </div>
              
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Statistiche percorso</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-sm text-gray-500">Appuntamenti</p>
                    <p className="text-2xl font-bold">{route.length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-sm text-gray-500">Tempo stimato</p>
                    <p className="text-2xl font-bold">{routeStats.duration} min</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <p className="text-sm text-gray-500">Distanza stimata</p>
                    <p className="text-2xl font-bold">~{routeStats.distance} km</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal Nuovo Contatto */}
          {showContactForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nuovo Contatto</h3>
                  <button onClick={() => setShowContactForm(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome*</label>
                    <input type="text" className="w-full border rounded p-2" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefono*</label>
                    <input type="text" className="w-full border rounded p-2" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Indirizzo</label>
                    <GeoapifyGeocoderAutocomplete
                      placeholder="Inserisci un indirizzo..."
                      placeSelect={(result) =>
                        setNewContact(prev => ({
                          ...prev,
                          address: result.properties.formatted,
                          coordinates: { lat: result.geometry.coordinates[1], lon: result.geometry.coordinates[0] }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea className="w-full border rounded p-2" rows="3" value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}></textarea>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button className="bg-gray-300 py-2 px-4 rounded" onClick={() => setShowContactForm(false)}>
                      Annulla
                    </button>
                    <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={handleAddContact}>
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal Modifica Contatto */}
          {contactToEdit && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Modifica Contatto</h3>
                  <button onClick={() => setContactToEdit(null)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome*</label>
                    <input type="text" className="w-full border rounded p-2" value={contactToEdit.name} onChange={(e) => setContactToEdit({ ...contactToEdit, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefono*</label>
                    <input type="text" className="w-full border rounded p-2" value={contactToEdit.phone} onChange={(e) => setContactToEdit({ ...contactToEdit, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Indirizzo</label>
                    <GeoapifyGeocoderAutocomplete
                      placeholder="Modifica indirizzo..."
                      placeSelect={(result) =>
                        setContactToEdit(prev => ({
                          ...prev,
                          address: result.properties.formatted,
                          coordinates: { lat: result.geometry.coordinates[1], lon: result.geometry.coordinates[0] }
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea className="w-full border rounded p-2" rows="3" value={contactToEdit.notes} onChange={(e) => setContactToEdit({ ...contactToEdit, notes: e.target.value })}></textarea>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button className="bg-gray-300 py-2 px-4 rounded" onClick={() => setContactToEdit(null)}>
                      Annulla
                    </button>
                    <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={handleUpdateContact}>
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Modal Nuovo Appuntamento */}
          {showAppointmentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Nuovo Appuntamento</h3>
                  <button onClick={() => setShowAppointmentForm(false)}>
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cliente*</label>
                    <select className="w-full border rounded p-2" value={newAppointment.contactId} onChange={(e) => setNewAppointment({ ...newAppointment, contactId: parseInt(e.target.value) })}>
                      <option value="">Seleziona un cliente</option>
                      {contacts.map(contact => (
                        <option key={contact.id} value={contact.id}>{contact.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data*</label>
                    <input type="date" className="w-full border rounded p-2" value={newAppointment.date} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Orario*</label>
                    <input type="time" className="w-full border rounded p-2" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Durata (minuti)</label>
                    <input type="number" className="w-full border rounded p-2" value={newAppointment.duration} onChange={(e) => setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Note</label>
                    <textarea className="w-full border rounded p-2" rows="3" value={newAppointment.notes} onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}></textarea>
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button className="bg-gray-300 py-2 px-4 rounded" onClick={() => setShowAppointmentForm(false)}>
                      Annulla
                    </button>
                    <button className="bg-blue-500 text-white py-2 px-4 rounded" onClick={handleAddAppointment}>
                      Salva
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Navigazione mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-500 text-white p-2 flex justify-around shadow-inner">
          <button className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-200' : 'text-white'}`} onClick={() => setActiveTab('dashboard')}>
            <Calendar size={20} />
            <span className="text-xs">Dashboard</span>
          </button>
          <button className={`flex flex-col items-center ${activeTab === 'contacts' ? 'text-blue-200' : 'text-white'}`} onClick={() => setActiveTab('contacts')}>
            <User size={20} />
            <span className="text-xs">Contatti</span>
          </button>
          <button className={`flex flex-col items-center ${activeTab === 'calendar' ? 'text-blue-200' : 'text-white'}`} onClick={() => setActiveTab('calendar')}>
            <Calendar size={20} />
            <span className="text-xs">Calendario</span>
          </button>
          <button className={`flex flex-col items-center ${activeTab === 'route' ? 'text-blue-200' : 'text-white'}`} onClick={() => setActiveTab('route')}>
            <Map size={20} />
            <span className="text-xs">Percorsi</span>
          </button>
        </nav>
      </div>
    </GeoapifyContext>
  );
};

export default SalesAgendaApp;
