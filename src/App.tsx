import { useState, useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { CheckIcon, XMarkIcon, TrophyIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

// Tipos
type Prize = {
  id: number;
  name: string;
  description: string;
};

type Ticket = {
  number: number;
  name: string;
  isPaid: boolean;
  isWinner: boolean;
  prizeId?: number; // ID del premio ganado (si aplica)
};

function App() {
  // Estados
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [prizes, setPrizes] = useState<number>(0);
  const [remainingPrizes, setRemainingPrizes] = useState<number>(0);
  const [showTicketForm, setShowTicketForm] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(true);
  const [config, setConfig] = useState({
    totalTickets: 100,
    totalPrizes: 1,
    prizes: [
      { id: 1, name: 'Premio 1', description: 'Descripción del premio 1' }
    ] as Prize[]
  });
  
  // Estados para la animación del sorteo
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentDrawNumber, setCurrentDrawNumber] = useState<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const drawSpeed = useRef<number>(100); // Velocidad inicial de la animación
  const animationStartTime = useRef<number>(0);
  const drawDuration = 3000; // Duración total de la animación en ms
  
  const [currentTicket, setCurrentTicket] = useState<{
    number: string;
    name: string;
    isPaid: boolean;
  }>({ number: '', name: '', isPaid: false });

  // Inicializar boletos
  useEffect(() => {
    const savedTickets = localStorage.getItem('raffleTickets');
    const savedPrizes = localStorage.getItem('rafflePrizes');
    const savedRemainingPrizes = localStorage.getItem('remainingPrizes');
    const savedTotalTickets = localStorage.getItem('totalTickets');
    const savedConfig = localStorage.getItem('raffleConfig');

    if (savedConfig) {
      const configData = JSON.parse(savedConfig);
      setConfig(configData);
      setTotalTickets(configData.totalTickets);
      setPrizes(configData.totalPrizes);
      setRemainingPrizes(configData.totalPrizes);
      
      if (savedTickets) {
        setTickets(JSON.parse(savedTickets));
      } else {
        const initialTickets = Array.from({ length: configData.totalTickets }, (_, i) => ({
          number: i + 1,
          name: '',
          isPaid: false,
          isWinner: false,
        }));
        setTickets(initialTickets);
      }

      if (savedPrizes) setPrizes(Number(savedPrizes));
      if (savedRemainingPrizes) setRemainingPrizes(Number(savedRemainingPrizes));
      
      // Si ya hay configuración guardada, no mostramos la pantalla de configuración
      if (savedTickets || savedPrizes || savedRemainingPrizes || savedTotalTickets) {
        setShowConfig(false);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambian los boletos
  useEffect(() => {
    localStorage.setItem('raffleTickets', JSON.stringify(tickets));
    if (totalTickets > 0) {
      localStorage.setItem('totalTickets', totalTickets.toString());
    }
  }, [tickets, totalTickets]);

  // Guardar configuración de premios
  useEffect(() => {
    localStorage.setItem('rafflePrizes', prizes.toString());
    localStorage.setItem('remainingPrizes', remainingPrizes.toString());
  }, [prizes, remainingPrizes]);
  
  // Guardar configuración
  const saveConfig = () => {
    if (config.totalTickets <= 0 || config.totalPrizes <= 0) {
      toast.error('El número de boletos y premios debe ser mayor a 0');
      return;
    }
    
    if (config.totalPrizes > config.totalTickets) {
      toast.error('El número de premios no puede ser mayor al número de boletos');
      return;
    }
    
    // Asegurarse de que haya suficientes premios definidos
    const updatedPrizes = [...config.prizes];
    while (updatedPrizes.length < config.totalPrizes) {
      updatedPrizes.push({
        id: updatedPrizes.length + 1,
        name: `Premio ${updatedPrizes.length + 1}`,
        description: `Descripción del premio ${updatedPrizes.length + 1}`
      });
    }
    
    const finalConfig = {
      ...config,
      prizes: updatedPrizes.slice(0, config.totalPrizes)
    };
    
    setTotalTickets(finalConfig.totalTickets);
    setPrizes(finalConfig.totalPrizes);
    setRemainingPrizes(finalConfig.totalPrizes);
    
    // Crear boletos iniciales
    const initialTickets = Array.from({ length: finalConfig.totalTickets }, (_, i) => ({
      number: i + 1,
      name: '',
      isPaid: false,
      isWinner: false,
    }));
    
    setTickets(initialTickets);
    setShowConfig(false);
    
    // Guardar configuración
    localStorage.setItem('raffleConfig', JSON.stringify(finalConfig));
    localStorage.setItem('raffleTickets', JSON.stringify(initialTickets));
    localStorage.setItem('rafflePrizes', finalConfig.totalPrizes.toString());
    localStorage.setItem('remainingPrizes', finalConfig.totalPrizes.toString());
    localStorage.setItem('totalTickets', finalConfig.totalTickets.toString());
    
    toast.success('Configuración guardada correctamente');
  };
  
  // Reiniciar configuración
  const resetConfig = () => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar la configuración? Se perderán todos los datos.')) {
      localStorage.clear();
      setConfig({
        totalTickets: 100,
        totalPrizes: 3,
        prizes: [
          { id: 1, name: 'Premio 1', description: 'Descripción del premio 1' },
          { id: 2, name: 'Premio 2', description: 'Descripción del premio 2' },
          { id: 3, name: 'Premio 3', description: 'Descripción del premio 3' }
        ]
      });
      setTickets([]);
      setShowConfig(true);
    }
  };

  // Manejar cambios en el formulario de boletos
  const handleTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentTicket({
      ...currentTicket,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Agregar o actualizar un boleto
  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketNumber = parseInt(currentTicket.number);

    if (isNaN(ticketNumber) || ticketNumber < 1 || ticketNumber > totalTickets) {
      toast.error(`El número de boleto debe estar entre 1 y ${totalTickets}`);
      return;
    }

    const updatedTickets = [...tickets];
    const existingTicketIndex = updatedTickets.findIndex(
      (t) => t.number === ticketNumber
    );

    if (existingTicketIndex >= 0) {
      // Actualizar boleto existente
      updatedTickets[existingTicketIndex] = {
        ...updatedTickets[existingTicketIndex],
        name: currentTicket.name,
        isPaid: currentTicket.isPaid,
      };
    } else {
      // Agregar nuevo boleto
      updatedTickets.push({
        number: ticketNumber,
        name: currentTicket.name,
        isPaid: currentTicket.isPaid,
        isWinner: false,
      });
    }

    setTickets(updatedTickets);
    setCurrentTicket({ number: '', name: '', isPaid: false });
    setShowTicketForm(false);
    toast.success('Boleto guardado exitosamente');
  };

  // Seleccionar un boleto para editar
  const handleEditTicket = (ticketNumber: number) => {
    const ticket = tickets.find((t) => t.number === ticketNumber);
    if (ticket) {
      setCurrentTicket({
        number: ticket.number.toString(),
        name: ticket.name,
        isPaid: ticket.isPaid,
      });
      setShowTicketForm(true);
    }
  };

  // Función para iniciar la animación del sorteo
  const startDrawing = () => {
    const paidTickets = tickets.filter((t) => t.isPaid && !t.isWinner);
    
    if (paidTickets.length === 0) {
      toast.error('No hay boletos pagados disponibles para el sorteo');
      return;
    }
    
    if (remainingPrizes === 0) {
      toast.error('Ya se han sorteado todos los premios');
      return;
    }
    
    // Iniciar animación
    setIsDrawing(true);
    animationStartTime.current = Date.now();
    drawSpeed.current = 100; // Resetear velocidad
    
    // Función de animación
    const animate = () => {
      const elapsed = Date.now() - animationStartTime.current;
      const progress = Math.min(elapsed / drawDuration, 1);
      
      // Aumentar progresivamente la velocidad
      if (progress < 0.8) {
        drawSpeed.current = Math.max(20, 100 - (progress * 100));
      } else {
        // Reducir la velocidad al final
        const finalProgress = (progress - 0.8) / 0.2;
        drawSpeed.current = 20 + (finalProgress * 200);
      }
      
      // Seleccionar un número aleatorio de los boletos pagados
      const randomIndex = Math.floor(Math.random() * paidTickets.length);
      setCurrentDrawNumber(paidTickets[randomIndex].number);
      
      if (progress < 1) {
        // Continuar la animación
        animationRef.current = window.setTimeout(animate, drawSpeed.current);
      } else {
        // Finalizar la animación y seleccionar al ganador
        finishDrawing(paidTickets[randomIndex]);
      }
    };
    
    // Iniciar la animación
    animate();
  };
  
  // Función para finalizar el sorteo
  const finishDrawing = (winner: Ticket) => {
    // Limpiar la animación
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    
    // Obtener el próximo premio disponible
    const nextPrizeIndex = prizes - remainingPrizes;
    const prize = config.prizes[nextPrizeIndex];
    
    // Marcar como ganador con el premio correspondiente
    const updatedTickets = tickets.map((t) =>
      t.number === winner.number 
        ? { 
            ...t, 
            isWinner: true, 
            prizeId: prize?.id 
          } 
        : t
    );
    
    setTickets(updatedTickets);
    setRemainingPrizes((prev) => prev - 1);
    
    // Mostrar notificación con el premio
    setTimeout(() => {
      toast.success(
        (t) => (
          <div className="text-center">
            <p className="font-bold text-lg">¡Tenemos un ganador para {prize?.name}!</p>
            <p>Boleto: {winner.number}</p>
            <p>Ganador: {winner.name || 'Sin nombre'}</p>
            <p>Premio: {prize?.description}</p>
            <p>Premios restantes: {remainingPrizes - 1}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setCurrentDrawNumber(winner.number);
              }}
              className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Ver boleto
            </button>
          </div>
        ),
        { duration: 10000 }
      );
    }, 500);
    
    // Limpiar estados
    setTimeout(() => {
      setIsDrawing(false);
      setCurrentDrawNumber(null);
    }, 1000);
  };
  
  // Limpiar la animación al desmontar el componente
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  // Reiniciar la rifa
  const resetRaffle = () => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar la rifa? Se mantendrán los boletos pero se eliminarán los ganadores.')) {
      // Mantener los boletos existentes pero quitar el estado de ganador
      const resetTickets = tickets.map(ticket => ({
        ...ticket,
        isWinner: false
      }));
      
      setTickets(resetTickets);
      setRemainingPrizes(prizes);
      
      // Actualizar el localStorage
      localStorage.setItem('raffleTickets', JSON.stringify(resetTickets));
      localStorage.setItem('remainingPrizes', prizes.toString());
      
      toast.success('Rifa reiniciada exitosamente. Se mantuvieron los boletos existentes.');
    }
  };

  // Obtener boleto por número
  const getTicket = (number: number) => {
    return tickets.find((t) => t.number === number) || {
      number,
      name: '',
      isPaid: false,
      isWinner: false,
    };
  };

  // Manejar cambio en los premios
  const handlePrizeChange = (index: number, field: keyof Prize, value: string) => {
    const updatedPrizes = [...config.prizes];
    updatedPrizes[index] = {
      ...updatedPrizes[index],
      [field]: value
    };
    setConfig({
      ...config,
      prizes: updatedPrizes
    });
  };

  // Agregar un nuevo premio
  const addPrize = () => {
    const newPrize = {
      id: config.prizes.length + 1,
      name: `Premio ${config.prizes.length + 1}`,
      description: `Descripción del premio ${config.prizes.length + 1}`
    };
    setConfig({
      ...config,
      totalPrizes: config.totalPrizes + 1,
      prizes: [...config.prizes, newPrize]
    });
  };

  // Eliminar un premio
  const removePrize = (index: number) => {
    if (config.prizes.length <= 1) {
      toast.error('Debe haber al menos un premio');
      return;
    }
    
    const updatedPrizes = config.prizes.filter((_, i) => i !== index);
    setConfig({
      ...config,
      totalPrizes: updatedPrizes.length,
      prizes: updatedPrizes
    });
  };

  // Pantalla de configuración
  if (showConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">Configuración de la Rifa</h1>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número total de boletos
                </label>
                <input
                  type="number"
                  min="1"
                  value={config.totalTickets}
                  onChange={(e) => setConfig({...config, totalTickets: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de premios
                </label>
                <div className="flex">
                  <input
                    type="number"
                    min="1"
                    value={config.totalPrizes}
                    onChange={(e) => {
                      const newTotal = Math.max(1, parseInt(e.target.value) || 1);
                      const currentPrizes = [...config.prizes];
                      
                      // Ajustar la lista de premios según el nuevo total
                      while (currentPrizes.length < newTotal) {
                        currentPrizes.push({
                          id: currentPrizes.length + 1,
                          name: `Premio ${currentPrizes.length + 1}`,
                          description: `Descripción del premio ${currentPrizes.length + 1}`
                        });
                      }
                      
                      setConfig({
                        ...config,
                        totalPrizes: newTotal,
                        prizes: currentPrizes.slice(0, newTotal)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 3"
                  />
                  <button
                    onClick={addPrize}
                    className="bg-blue-100 text-blue-700 px-3 rounded-r-md hover:bg-blue-200 focus:outline-none"
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Configuración de Premios</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {config.prizes.map((prize, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Premio {index + 1}</h4>
                      {config.prizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrize(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Nombre del premio</label>
                        <input
                          type="text"
                          value={prize.name}
                          onChange={(e) => handlePrizeChange(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ej: Primer Lugar"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Descripción</label>
                        <input
                          type="text"
                          value={prize.description}
                          onChange={(e) => handlePrizeChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ej: Un auto último modelo"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 space-y-3">
              <button
                onClick={saveConfig}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Guardar y Empezar
              </button>
              
              {tickets.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Volver sin guardar
                </button>
              )}
            </div>
            
            {tickets.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowConfig(false)}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Volver a la rifa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowConfig(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center"
              title="Cambiar configuración"
            >
              <ArrowPathIcon className="w-5 h-5 mr-1" />
              Configuración
            </button>
            <h1 className="text-4xl font-bold text-gray-800">RifaApp</h1>
            <div className="w-24"></div> {/* Para mantener el espacio y centrar el título */}
          </div>
          <p className="text-gray-600">Sistema de administración de rifas</p>
          
          <div className="mt-6 flex justify-center gap-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-500">Boletos vendidos</p>
              <p className="text-2xl font-bold">
                {tickets.filter((t) => t.name).length} / {totalTickets}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-500">Boletos pagados</p>
              <p className="text-2xl font-bold">
                {tickets.filter((t) => t.isPaid).length} / {totalTickets}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-sm text-gray-500">Premios restantes</p>
              <p className="text-2xl font-bold">{remainingPrizes} / {prizes}</p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setShowTicketForm(true)}
                className="btn btn-primary"
              >
                Agregar Boleto
              </button>
              
              <button
                onClick={startDrawing}
                disabled={remainingPrizes === 0 || tickets.filter(t => t.isPaid && !t.isWinner).length === 0 || isDrawing}
                className={`btn ${(remainingPrizes === 0 || tickets.filter(t => t.isPaid && !t.isWinner).length === 0) ? 'bg-gray-400' : 'btn-success'} ${isDrawing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isDrawing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sorteando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <TrophyIcon className="w-5 h-5 mr-2" />
                    Sortear Ganador
                  </span>
                )}
              </button>
              
              <button
                onClick={resetRaffle}
                className="btn bg-amber-600 text-white hover:bg-amber-700"
              >
                Reiniciar Boletos
              </button>
              
              <button
                onClick={resetConfig}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                Nueva Rifa
              </button>
            </div>
            
            <div className="w-full text-center mt-2">
              <p className="text-sm text-gray-600">
                Boletos: {tickets.filter(t => t.name).length} de {totalTickets} | 
                Pagados: {tickets.filter(t => t.isPaid).length} | 
                Premios: {prizes - remainingPrizes} de {prizes}
              </p>
            </div>
          </div>
        </header>

        {/* Formulario de boleto */}
        {showTicketForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {currentTicket.number ? 'Editar Boleto' : 'Nuevo Boleto'}
                </h2>
                <button
                  onClick={() => {
                    setShowTicketForm(false);
                    setCurrentTicket({ number: '', name: '', isPaid: false });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de boleto (1-{totalTickets})
                  </label>
                  <input
                    type="number"
                    name="number"
                    value={currentTicket.number}
                    onChange={handleTicketChange}
                    min="1"
                    max={totalTickets}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del comprador
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={currentTicket.name}
                    onChange={handleTicketChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPaid"
                    name="isPaid"
                    checked={currentTicket.isPaid}
                    onChange={handleTicketChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isPaid" className="ml-2 block text-sm text-gray-700">
                    ¿Pagado?
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTicketForm(false);
                      setCurrentTicket({ number: '', name: '', isPaid: false });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Matriz de boletos */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Boletos</h2>
          
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {Array.from({ length: totalTickets }, (_, i) => {
              const ticket = getTicket(i + 1);
              const isSold = !!ticket.name;
              
              return (
                <div
                  key={i + 1}
                  onClick={() => handleEditTicket(i + 1)}
                  className={`ticket ${ticket.isWinner ? 'ticket-winner' : ''} ${
                    ticket.isPaid ? 'ticket-paid' : isSold ? 'ticket-sold' : ''
                  }`}
                  title={`Boleto ${i + 1}${ticket.name ? ` - ${ticket.name}` : ''}`}
                >
                  <span className="font-medium">{i + 1}</span>
                  {isSold && (
                    <span className="text-xs mt-1 truncate w-full px-1 text-center">
                      {ticket.name}
                    </span>
                  )}
                  {ticket.isWinner && (
                    <TrophyIcon className="w-4 h-4 text-yellow-500 mt-1" />
                  )}
                  {ticket.isPaid && !ticket.isWinner && (
                    <CheckIcon className="w-4 h-4 text-green-500 mt-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Sección de ganadores */}
        {tickets.some(t => t.isWinner) && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Ganadores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets
                .filter((t) => t.isWinner)
                .map((winner) => {
                  // Obtener el premio correspondiente al ganador
                  const prize = config.prizes.find(p => p.id === winner.prizeId) || {
                    name: 'Premio no definido',
                    description: 'Sin descripción disponible'
                  };
                  
                  return (
                    <div
                      key={winner.number}
                      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start">
                        <div className="bg-yellow-100 p-3 rounded-full mr-4 flex-shrink-0">
                          <TrophyIcon className="w-8 h-8 text-yellow-500" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-yellow-700">{prize.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{prize.description}</p>
                          <div className="mt-2 pt-2 border-t border-yellow-100">
                            <p className="text-sm">
                              <span className="font-medium">Ganador:</span> {winner.name || 'Sin nombre'}
                            </p>
                            <p className="text-sm">
                              <span className="font-medium">Boleto:</span> {winner.number}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        
        {/* Overlay de carga durante el sorteo */}
        {isDrawing && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md w-full mx-4">
              <div className="mb-6">
                <svg className="animate-spin h-16 w-16 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Sorteando...</h2>
              
              {currentDrawNumber && (
                <div className="my-8">
                  <div className="text-6xl font-extrabold text-blue-600 animate-pulse">
                    {currentDrawNumber}
                  </div>
                  <p className="text-gray-600 mt-2">Buscando ganador...</p>
                </div>
              )}
              
              <p className="text-gray-600 mt-4">
                Por favor espera mientras seleccionamos al ganador.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
