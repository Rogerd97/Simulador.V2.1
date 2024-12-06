import React, { useState, useEffect } from "react";
import { getParametria } from "./utils/parametria";
import "./styles.css";

const productosFNG = {
  EMP001: {
    nombre: "Producto Empresarial 001",
    plazosMinimos: 12,
    plazosMaximos: 60,
    tipoComision: "fija",
    comisionesPorPlazo: {
      12: 0.025,
      24: 0.0376,
      36: 0.0502,
      48: 0.0626,
      60: 0.0748,
    },
    modalidadComision: "capitalTotal",
  },
  EMP319: {
    nombre: "Producto Empresarial 319",
    plazosMinimos: 2,
    plazosMaximos: 60,
    tipoComision: "variable",
    comisionesPorPlazo: {
      2: 0.0046,
      12: 0.0275,
      24: 0.0414,
      36: 0.0552,
      48: 0.0688,
      60: 0.0822,
    },
    modalidadComision: "capitalTotal",
  },
  EMP023: {
    nombre: "Producto Empresarial 023",
    plazosMinimos: 2,
    plazosMaximos: 60,
    tipoComision: "variable",
    comisionesPorPlazo: {
      2: 0.0042,
      12: 0.025,
      24: 0.0376,
      36: 0.0502,
      48: 0.0626,
      60: 0.0748,
    },
    modalidadComision: "capitalTotal",
  },
  EMP231: {
    nombre: "Producto Empresarial 231",
    plazosMinimos: 2,
    plazosMaximos: 60,
    tipoComision: "variable",
    comisionesPorPlazo: {
      2: 0.0046,
      12: 0.0275,
      24: 0.0414,
      36: 0.0552,
      48: 0.0688,
      60: 0.0822,
    },
    modalidadComision: "capitalTotal",
  },
  EMP280: {
    nombre: "Producto Empresarial 280",
    plazosMinimos: 12,
    plazosMaximos: 60,
    tipoComision: "fija",
    comisionesPorPlazo: {
      12: 0.025,
      24: 0.0376,
      36: 0.0502,
      48: 0.0626,
      60: 0.0748,
    },
    modalidadComision: "capitalTotal",
  },
  EMP080: {
    nombre: "Producto Empresarial 080",
    plazosMinimos: 12,
    plazosMaximos: 60,
    tipoComision: "fija",
    comisionesPorPlazo: {
      12: 0.025,
      24: 0.0376,
      36: 0.0502,
      48: 0.0626,
      60: 0.0748,
    },
    modalidadComision: "capitalTotal",
  },
  EMP320: {
    nombre: "Producto Empresarial 320",
    tipoComision: "saldoPendiente",
    tasaComisionMensual: 0.005,
    modalidadComision: "saldoMensual",
  },
  EMP300: {
    nombre: "Producto Empresarial 300",
    tipoComision: "saldoPendiente",
    tasaComisionMensual: 0.0055,
    modalidadComision: "saldoMensual",
  },
  EMP200: {
    nombre: "Producto Empresarial 200",
    tipoComision: "saldoPendiente",
    tasaComisionMensual: 0.006,
    modalidadComision: "saldoMensual",
  },
};

// Configuración de tasas de interés
const tasasInteresRural = [
  { min: 1000000, max: 3000000, ea: 0.69, nmv: 0.5364, mv: 0.0447 },
  { min: 3000001, max: 5000000, ea: 0.68, nmv: 0.5302, mv: 0.0442 },
  { min: 5000001, max: 7800000, ea: 0.68, nmv: 0.5302, mv: 0.0442 },
  { min: 7800001, max: 15600000, ea: 0.2478, nmv: 0.2234, mv: 0.0186 },
  { min: 15600001, max: 32500000, ea: 0.2478, nmv: 0.2234, mv: 0.0186 },
  { min: 32500001, max: 156000000, ea: 0.3998, nmv: 0.3411, mv: 0.0284 },
];

const tasasInteresUrbano = [
  { min: 1000000, max: 3000000, ea: 0.73, nmv: 0.5608, mv: 0.0467 },
  { min: 3000001, max: 5000000, ea: 0.7, nmv: 0.5425, mv: 0.0452 },
  { min: 5000001, max: 7800000, ea: 0.7, nmv: 0.5425, mv: 0.0452 },
  { min: 7800001, max: 15600000, ea: 0.534, nmv: 0.4356, mv: 0.0363 },
  { min: 15600001, max: 32500000, ea: 0.534, nmv: 0.4356, mv: 0.0363 },
  { min: 32500001, max: 156000000, ea: 0.3998, nmv: 0.3411, mv: 0.0284 },
];

const leyMipyme = [
  { min: 1000000, max: 15600000, comision: 0.075 },
  { min: 15600001, max: 32500000, comision: 0.045 },
];

const SimuladorCredito = () => {
  // Obtener parametría
  const parametria = getParametria();

  // Estados
  const [montoError, setMontoError] = useState("");
  const [monto, setMonto] = useState("");
  const [plazo, setPlazo] = useState("");
  const [modalidadPago, setModalidadPago] = useState("Mensual");
  const [amortizacion, setAmortizacion] = useState([]);
  const [error, setError] = useState("");
  const [fngRate, setFngRate] = useState(0);
  const [mipymeRate, setMipymeRate] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [modalidadCredito, setModalidadCredito] = useState("Micro");
  const [tipologia, setTipologia] = useState("Rural");
  const [fngPaymentOption, setFngPaymentOption] = useState("Diferido");
  const [mipymePaymentOption, setMipymePaymentOption] = useState("Diferido");
  const [productoFNG, setProductoFNG] = useState("");

  // Constantes desde parametría
  const SEGURO_VIDA_RATE =
    parametria.configuracionGeneral.seguroVida.tasaPorMil;
  const PLAZO_MINIMO = parametria.configuracionGeneral.plazoMinimo;

  // Funciones de cálculo y validación
  const validateMonto = (valor) => {
    if (valor < parametria.configuracionGeneral.montoMinimo) {
      setMontoError("❌ El monto mínimo es de 1 millón de COP.");
      return false;
    }
    if (valor > parametria.configuracionGeneral.montoMaximo) {
      setMontoError("❌ El monto máximo permitido es de 156.000.000 COP.");
      return false;
    }
    setMontoError("");
    return true;
  };

  const calcularTasaFNG = (monto, plazoMeses) => {
    const producto = parametria.productosFNG[productoFNG];
    if (!producto) return 0;

    if (producto.tipoComision === "saldoPendiente") {
      return producto.tasaComisionMensual;
    }

    return producto.comisionesPorPlazo[plazoMeses] || 0;
  };

  const calcularMipyme = (monto) => {
    for (const rango of parametria.leyMipyme) {
      if (monto >= rango.min && monto <= rango.max) {
        return rango.comision;
      }
    }
    return 0;
  };

  const calcularTasaInteres = (monto) => {
    const tasasInteres =
      tipologia === "Rural"
        ? parametria.tasasInteresRural
        : parametria.tasasInteresUrbano;
    for (const rango of tasasInteres) {
      if (monto >= rango.min && monto <= rango.max) {
        return rango.mv;
      }
    }
    return 0;
  };

  const calcularSeguroVida = (saldo) => {
    return (saldo / 1000) * SEGURO_VIDA_RATE;
  };

  const ajustarTasaInteresPorPeriodicidad = (tasaMensual, modalidad) => {
    const frecuenciaPago = {
      Mensual: 1,
      Bimensual: 2,
      Trimestral: 3,
      Cuatrimestral: 4,
      Semestral: 6,
    };
    return Math.pow(1 + tasaMensual, frecuenciaPago[modalidad]) - 1;
  };

  const calcularAmortizacion = (
    capital,
    tasaMensual,
    plazoPeriodos,
    modalidad
  ) => {
    const frecuenciaPago = {
      Mensual: 1,
      Bimensual: 2,
      Trimestral: 3,
      Cuatrimestral: 4,
      Semestral: 6,
    };

    const mesesPorPeriodo = frecuenciaPago[modalidad];
    const plazoTotalMeses = plazoPeriodos * mesesPorPeriodo;
    const tasaPeriodica = ajustarTasaInteresPorPeriodicidad(
      tasaMensual,
      modalidad
    );
    const seguroVidaMensual = calcularSeguroVida(capital);

    // Cálculo de la cuota constante
    const cuotaConstante =
      (capital * tasaPeriodica) /
      (1 - Math.pow(1 + tasaPeriodica, -plazoPeriodos));

    // Cálculo del FNG total
    const fngTotal =
      productosFNG[productoFNG].modalidadComision === "capitalTotal"
        ? capital * fngRate
        : 0;

    let amortizacion = [];
    let saldo = capital;
    let mesesTranscurridos = 0;

    // Cálculo inicial de Mipyme para el primer año
    let mipymeInicial = capital * mipymeRate * 1.19; // Capital inicial * tasa * IVA

    for (let i = 1; i <= plazoPeriodos; i++) {
      // Cálculo de Mipyme
      let mipymeCuota = 0;
      if (mipymePaymentOption === "Anticipado") {
        // Si es anticipado y es la primera cuota del año
        if (mesesTranscurridos % 12 === 0) {
          if (mesesTranscurridos === 0) {
            // Primer año: usar capital inicial
            mipymeCuota = mipymeInicial;
          } else {
            // Años siguientes: recalcular sobre saldo
            mipymeCuota = saldo * mipymeRate * 1.19;
          }
        }
      } else {
        // Diferido
        // Para el primer año
        if (mesesTranscurridos < 12) {
          const cuotasPorAno = Math.ceil(12 / mesesPorPeriodo);
          mipymeCuota = mipymeInicial / cuotasPorAno;
        }
        // Para años siguientes
        else if (mesesTranscurridos % 12 === 0) {
          const mesesRestantes = plazoTotalMeses - mesesTranscurridos;
          const cuotasRestantes = Math.ceil(
            Math.min(12, mesesRestantes) / mesesPorPeriodo
          );
          mipymeCuota = (saldo * mipymeRate * 1.19) / cuotasRestantes;
        }
        // Continuar cobrando las cuotas del año actual
        else if (mesesTranscurridos % 12 < 12) {
          const mesesRestantesDelAno = 12 - (mesesTranscurridos % 12);
          const cuotasRestantesDelAno = Math.ceil(
            mesesRestantesDelAno / mesesPorPeriodo
          );
          if (mesesTranscurridos < 12) {
            mipymeCuota = mipymeInicial / (12 / mesesPorPeriodo);
          } else {
            const inicioDelAno = Math.floor(mesesTranscurridos / 12) * 12;
            const saldoInicioAno =
              amortizacion.find(
                (cuota) => (cuota.cuota - 1) * mesesPorPeriodo === inicioDelAno
              )?.saldoRestante || saldo;
            mipymeCuota =
              (parseFloat(saldoInicioAno) * mipymeRate * 1.19) /
              (12 / mesesPorPeriodo);
          }
        }
      }

      // Cálculo de intereses y capital
      const interesCuota = saldo * tasaPeriodica;
      const capitalCuota = cuotaConstante - interesCuota;

      // Cálculo de FNG según modalidad
      let fngCuota = 0;
      if (productosFNG[productoFNG].modalidadComision === "saldoMensual") {
        fngCuota =
          saldo *
          productosFNG[productoFNG].tasaComisionMensual *
          mesesPorPeriodo *
          1.19;
      } else if (fngPaymentOption === "Anticipado" && i === 1) {
        fngCuota = fngTotal * 1.19;
      } else if (fngPaymentOption === "Diferido") {
        fngCuota = (fngTotal / plazoPeriodos) * 1.19;
      }

      // Cálculo del seguro de vida para el período
      const seguroVidaCuota = calcularSeguroVida(saldo);

      // Cálculo de la cuota total
      const cuotaTotal =
        cuotaConstante + fngCuota + mipymeCuota + seguroVidaCuota;

      saldo -= capitalCuota;
      mesesTranscurridos += mesesPorPeriodo;

      amortizacion.push({
        cuota: i,
        cuotaConstante: cuotaConstante.toFixed(2),
        capitalCuota: capitalCuota.toFixed(2),
        interesCuota: interesCuota.toFixed(2),
        fngCuota: fngCuota.toFixed(2),
        mipymeCuota: mipymeCuota.toFixed(2),
        seguroVidaCuota: seguroVidaCuota.toFixed(2),
        cuotaTotal: cuotaTotal.toFixed(2),
        saldoRestante: saldo.toFixed(2),
      });
    }

    return amortizacion;
  };

  // Agrega estas funciones dentro del componente SimuladorCredito

  const handleModalidadCreditoChange = (event) => {
    setModalidadCredito(event.target.value);
  };

  const handleTipologiaChange = (event) => {
    setTipologia(event.target.value);
  };

  const handlePlazoChange = (event) => {
    const valor = parseInt(event.target.value, 10);
    setPlazo(valor);
  };

  // Manejadores de eventos
  const handleCalcular = () => {
    if (!monto || !plazo || !modalidadPago || !productoFNG) {
      setError("❗ Por favor completa todos los campos.");
      return;
    }

    const montoNum = parseFloat(monto);
    if (!validateMonto(montoNum)) {
      setError("❗ Por favor corrige el monto antes de calcular.");
      return;
    }

    const frecuenciaPago = {
      Mensual: 1,
      Bimensual: 2,
      Trimestral: 3,
      Cuatrimestral: 4,
      Semestral: 6,
    };

    const plazoPeriodos = parseInt(plazo);
    const mesesPorPeriodo = frecuenciaPago[modalidadPago];
    const plazoMeses = plazoPeriodos * mesesPorPeriodo;

    // Validación del plazo mínimo
    if (plazoMeses < PLAZO_MINIMO) {
      setError(`❗ El plazo mínimo debe ser de ${PLAZO_MINIMO} meses.`);
      return;
    }

    // Validación del plazo según el producto FNG
    const productoSeleccionado = productosFNG[productoFNG];
    if (
      productoSeleccionado.plazosMinimos &&
      plazoMeses < productoSeleccionado.plazosMinimos
    ) {
      setError(
        `❗ El plazo mínimo para este producto FNG es de ${productoSeleccionado.plazosMinimos} meses.`
      );
      return;
    }
    if (
      productoSeleccionado.plazosMaximos &&
      plazoMeses > productoSeleccionado.plazosMaximos
    ) {
      setError(
        `❗ El plazo máximo para este producto FNG es de ${productoSeleccionado.plazosMaximos} meses.`
      );
      return;
    }

    const tasaMensual = interestRate;
    const amort = calcularAmortizacion(
      montoNum,
      tasaMensual,
      plazoPeriodos,
      modalidadPago
    );
    setAmortizacion(amort);
    setError("");
  };

  const handleReiniciar = () => {
    setMonto("");
    setPlazo("");
    setModalidadPago("Mensual");
    setAmortizacion([]);
    setError("");
    setFngRate(0);
    setMipymeRate(0);
    setInterestRate(0);
    setModalidadCredito("Micro");
    setTipologia("Rural");
    setMontoError("");
    setFngPaymentOption("Diferido");
    setMipymePaymentOption("Diferido");
    setProductoFNG("");
  };

  // Efectos
  useEffect(() => {
    if (monto && plazo && modalidadPago && productoFNG) {
      const montoNum = parseFloat(monto);
      const frecuenciaPago = {
        Mensual: 1,
        Bimensual: 2,
        Trimestral: 3,
        Cuatrimestral: 4,
        Semestral: 6,
      };
      const mesesPorPeriodo = frecuenciaPago[modalidadPago];
      const plazoMeses = plazo * mesesPorPeriodo;

      setFngRate(calcularTasaFNG(montoNum, plazoMeses));
      setMipymeRate(calcularMipyme(montoNum));
      setInterestRate(calcularTasaInteres(montoNum));
    }
  }, [monto, plazo, modalidadPago, productoFNG, tipologia]);

  // Renderizado del componente
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Título */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💰</span>
        <h1 className="text-2xl md:text-3xl font-bold">
          Simulador de Créditos
        </h1>
      </div>

      {/* Formulario principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Primera columna */}
        <div className="space-y-4">
          {/* Producto FNG */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>🏦</span>
              <span className="font-semibold">FNG aplicable:</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={productoFNG}
              onChange={(e) => setProductoFNG(e.target.value)}
            >
              <option value="">-- Seleccione un producto --</option>
              {Object.entries(parametria.productosFNG).map(
                ([codigo, producto]) => (
                  <option key={codigo} value={codigo}>
                    {producto.nombre} ({codigo})
                  </option>
                )
              )}
            </select>
          </div>

          {/* Monto */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>💵</span>
              <span className="font-semibold">Monto a solicitar (COP):</span>
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={monto}
              onChange={(e) => {
                setMonto(e.target.value);
                validateMonto(parseFloat(e.target.value));
              }}
              min="1000000"
              step="1000"
              placeholder="Mínimo 1.000.000 COP"
            />
            {montoError && (
              <p className="text-red-500 text-sm mt-1">{montoError}</p>
            )}
          </div>

          {/* Modalidad de pago */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>📅</span>
              <span className="font-semibold">Modalidad de pago:</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={modalidadPago}
              onChange={(e) => setModalidadPago(e.target.value)}
            >
              <option value="Mensual">Mensual</option>
              <option value="Bimensual">Bimensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
              <option value="Semestral">Semestral</option>
            </select>
          </div>
        </div>

        {/* Segunda columna */}
        <div className="space-y-4">
          {/* Número de períodos */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>⌛</span>
              <span className="font-semibold">Número de períodos:</span>
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={plazo}
              onChange={handlePlazoChange}
              min="1"
              placeholder="Ingrese el número de períodos"
            />
          </div>

          {/* Modalidad de crédito y Tipología */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <span>📋</span>
                  <span className="font-semibold">Modalidad de crédito:</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={modalidadCredito}
                  onChange={handleModalidadCreditoChange}
                >
                  <option value="Comercial">Comercial</option>
                  <option value="Micro">Micro</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <span>🏘️</span>
                  <span className="font-semibold">Tipología:</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={tipologia}
                  onChange={handleTipologiaChange}
                >
                  <option value="Rural">Rural</option>
                  <option value="Urbano">Urbano</option>
                </select>
              </div>
            </div>
          </div>

          {/* Formas de pago */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <span>💳</span>
                  <span className="font-semibold">Forma de Pago FNG:</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={fngPaymentOption}
                  onChange={(e) => setFngPaymentOption(e.target.value)}
                >
                  <option value="Diferido">Diferido</option>
                  <option value="Anticipado">Anticipado</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <span>📑</span>
                  <span className="font-semibold">Forma de Pago MiPyme:</span>
                </label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={mipymePaymentOption}
                  onChange={(e) => setMipymePaymentOption(e.target.value)}
                >
                  <option value="Diferido">Diferido</option>
                  <option value="Anticipado">Anticipado</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasas y seguro */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-sm">
            <span className="font-semibold">Tasa FNG:</span>
            <p className="mt-1">{(fngRate * 100).toFixed(2)}%</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Tasa Ley MiPyme:</span>
            <p className="mt-1">{(mipymeRate * 100).toFixed(2)}%</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Tasa de Interés (M.V.):</span>
            <p className="mt-1">{(interestRate * 100).toFixed(2)}%</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Seguro de Vida:</span>
            <p className="mt-1">0.8 COP por cada 1.000 COP prestados</p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleCalcular}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Calcular Amortización
        </button>
        <button
          onClick={handleReiniciar}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Reiniciar
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Tabla de Amortización */}
      {amortizacion.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">📊 Tabla de Amortización</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota Constante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capital
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  FNG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ley MiPyme
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seguro de Vida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo Restante
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amortizacion.map((cuota, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{cuota.cuota}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.cuotaConstante).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.capitalCuota).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.interesCuota).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.fngCuota).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.mipymeCuota).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.seguroVidaCuota).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.cuotaTotal).toLocaleString("es-CO")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {parseFloat(cuota.saldoRestante).toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SimuladorCredito;
