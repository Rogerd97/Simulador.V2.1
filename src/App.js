import React, { useState, useEffect } from "react";
import {
  getParametria,
  determinarTipoCredito,
  validarCedulaFondoEspecial,
  obtenerTasaInteres,
  obtenerFormaPagoFNG,
  calcularComisionMipyme,
  calcularCostoCentrales,
} from "./utils/parametria";
import "./styles.css";

const App = () => {
  // Estados base
  const [monto, setMonto] = useState("");
  const [plazo, setPlazo] = useState("");
  const [modalidadPago, setModalidadPago] = useState("Mensual");
  const [modalidadCredito, setModalidadCredito] = useState("MICROCREDITO");
  const [tipologia, setTipologia] = useState("RURAL");
  const [productoFNG, setProductoFNG] = useState("");
  const [cedula, setCedula] = useState("");
  const [tipoCredito, setTipoCredito] = useState("");

  // Estados para tasas y comisiones
  const [fngRate, setFngRate] = useState(0);
  const [mipymeRate, setMipymeRate] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [costoCentrales, setCostoCentrales] = useState(0);

  // Estados para opciones de pago
  const [mipymePaymentOption, setMipymePaymentOption] = useState("Diferido");

  // Estados para validación y errores
  const [montoError, setMontoError] = useState("");
  const [cedulaError, setCedulaError] = useState("");
  const [error, setError] = useState("");
  const [amortizacion, setAmortizacion] = useState([]);

  // Obtener parametría
  const parametria = getParametria();
  const SEGURO_VIDA_RATE =
    parametria.configuracionGeneral.seguroVida.tasaPorMil;
  const PLAZO_MINIMO = parametria.configuracionGeneral.plazoMinimo;
  const IVA = parametria.configuracionGeneral.iva;

  // Funciones de validación
  const validateMonto = (valor) => {
    if (!valor || valor < parametria.configuracionGeneral.montoMinimo) {
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

  const validarFondoEspecial = () => {
    if (!cedula && ["EMP080", "EMP280"].includes(productoFNG)) {
      setCedulaError("❌ Se requiere la cédula para este fondo.");
      return false;
    }

    if (["EMP080", "EMP280"].includes(productoFNG)) {
      const validacion = validarCedulaFondoEspecial(cedula);
      if (!validacion) {
        setCedulaError(
          "❌ La cédula no está autorizada para este fondo o la vigencia ha expirado."
        );
        return false;
      }
      if (validacion.fondo !== productoFNG) {
        setCedulaError(
          `❌ La cédula está autorizada para el fondo ${validacion.fondo}`
        );
        return false;
      }
    }
    setCedulaError("");
    return true;
  };

  // Funciones de cálculo
  const calcularTasaFNG = (monto, plazoMeses) => {
    const producto = parametria.productosFNG[productoFNG];
    if (!producto) return 0;

    if (producto.tipoComision === "SALDO_MENSUAL") {
      return producto.comisionMensual;
    }

    return producto.comisionesPorPlazo[plazoMeses] || 0;
  };

  const calcularSeguroVida = (saldo) => {
    return (saldo / 1000) * SEGURO_VIDA_RATE;
  };

  const ajustarTasaInteresPorPeriodicidad = (tasaMensual, modalidad) => {
    const frecuenciaPago = parametria.configuracionGeneral.modalidadesPago;
    const mesesPorPeriodo = frecuenciaPago[modalidad];
    return Math.pow(1 + tasaMensual, mesesPorPeriodo) - 1;
  };

  const calcularAmortizacion = (
    capital,
    tasaMensual,
    plazoPeriodos,
    modalidad
  ) => {
    const frecuenciaPago = parametria.configuracionGeneral.modalidadesPago;
    const mesesPorPeriodo = frecuenciaPago[modalidad];
    const plazoTotalMeses = plazoPeriodos * mesesPorPeriodo;
    const tasaPeriodica = ajustarTasaInteresPorPeriodicidad(
      tasaMensual,
      modalidad
    );

    // Cálculo de la cuota constante
    const cuotaConstante =
      (capital * tasaPeriodica) /
      (1 - Math.pow(1 + tasaPeriodica, -plazoPeriodos));

    // Cálculo inicial de comisiones
    const producto = parametria.productosFNG[productoFNG];
    const fngTotal =
      producto.tipoComision === "UNICA_ANTICIPADA" ? capital * fngRate : 0;
    const mipymeInicial = capital * mipymeRate;
    const centralesTotal = calcularCostoCentrales(capital);

    let amortizacion = [];
    let saldo = capital;
    let mesesTranscurridos = 0;

    for (let i = 1; i <= plazoPeriodos; i++) {
      // Cálculo de MiPyme
      let mipymeCuota = 0;
      if (mipymePaymentOption === "Anticipado") {
        if (mesesTranscurridos % 12 === 0) {
          mipymeCuota =
            (mesesTranscurridos === 0 ? mipymeInicial : saldo * mipymeRate) *
            (1 + IVA);
        }
      } else {
        if (mesesTranscurridos % 12 === 0) {
          const mipymeAnual =
            (mesesTranscurridos === 0 ? mipymeInicial : saldo * mipymeRate) *
            (1 + IVA);
          const cuotasRestantesAno = Math.ceil(
            (12 - (mesesTranscurridos % 12)) / mesesPorPeriodo
          );
          mipymeCuota = mipymeAnual / cuotasRestantesAno;
        }
      }

      // Cálculo de intereses y capital
      const interesCuota = saldo * tasaPeriodica;
      const capitalCuota = cuotaConstante - interesCuota;

      // Cálculo de FNG según modalidad
      let fngCuota = 0;
      if (producto.tipoComision === "SALDO_MENSUAL") {
        fngCuota =
          saldo * producto.comisionMensual * mesesPorPeriodo * (1 + IVA);
      } else if (i === 1 && producto.formaPago === "ANTICIPADO") {
        fngCuota = fngTotal * (1 + IVA);
      } else if (producto.formaPago === "DIFERIDO") {
        fngCuota = (fngTotal * (1 + IVA)) / plazoPeriodos;
      }

      // Cálculo del seguro de vida para el período
      const seguroVidaCuota = calcularSeguroVida(saldo);

      // Cálculo de centrales (solo en primera cuota)
      const centralesCuota = i === 1 ? centralesTotal : 0;

      // Cálculo de la cuota total
      const cuotaTotal =
        cuotaConstante +
        fngCuota +
        mipymeCuota +
        seguroVidaCuota +
        centralesCuota;

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
        centralesCuota: centralesCuota.toFixed(2),
        cuotaTotal: cuotaTotal.toFixed(2),
        saldoRestante: saldo.toFixed(2),
      });
    }

    return amortizacion;
  };

  // Efectos
  useEffect(() => {
    if (monto && plazo && modalidadPago && productoFNG) {
      const montoNum = parseFloat(monto);
      const nuevoTipoCredito = determinarTipoCredito(
        montoNum,
        modalidadCredito
      );
      setTipoCredito(nuevoTipoCredito);

      // Calcular tasas
      const tasas = obtenerTasaInteres(
        montoNum,
        modalidadCredito,
        nuevoTipoCredito,
        tipologia
      );
      if (tasas) {
        setInterestRate(tasas.mv);
      }

      // Calcular comisión MiPyme
      const comisionMipyme = calcularComisionMipyme(montoNum);
      setMipymeRate(comisionMipyme);

      // Calcular FNG
      const plazoMeses =
        plazo * parametria.configuracionGeneral.modalidadesPago[modalidadPago];
      setFngRate(calcularTasaFNG(montoNum, plazoMeses));

      // Calcular costo de centrales
      setCostoCentrales(calcularCostoCentrales(montoNum));
    }
  }, [monto, plazo, modalidadPago, productoFNG, modalidadCredito, tipologia]);

  // Manejadores de eventos
  const handleMontoChange = (e) => {
    const valor = e.target.value;
    setMonto(valor);
    if (valor) {
      validateMonto(parseFloat(valor));
    }
  };

  const handlePlazoChange = (e) => {
    const valor = parseInt(e.target.value, 10);
    const producto = parametria.productosFNG[productoFNG];

    if (producto) {
      const mesesPorPeriodo =
        parametria.configuracionGeneral.modalidadesPago[modalidadPago];
      const plazoMeses = valor * mesesPorPeriodo;

      if (producto.plazos && plazoMeses < producto.plazos.minimo) {
        setError(
          `❗ El plazo mínimo para este producto es de ${producto.plazos.minimo} meses.`
        );
        return;
      }
      if (producto.plazos && plazoMeses > producto.plazos.maximo) {
        setError(
          `❗ El plazo máximo para este producto es de ${producto.plazos.maximo} meses.`
        );
        return;
      }
    }

    if (
      valor * parametria.configuracionGeneral.modalidadesPago[modalidadPago] <
      PLAZO_MINIMO
    ) {
      setError(`❗ El plazo mínimo debe ser de ${PLAZO_MINIMO} meses.`);
      return;
    }

    setError("");
    setPlazo(valor);
  };

  const handleProductoFNGChange = (e) => {
    const nuevoProducto = e.target.value;
    setProductoFNG(nuevoProducto);

    const producto = parametria.productosFNG[nuevoProducto];
    if (producto) {
      // Si el producto requiere validación de cédula y no hay cédula
      if (["EMP080", "EMP280"].includes(nuevoProducto) && !cedula) {
        setCedulaError("❌ Este producto requiere validación de cédula.");
      }
      // Si el producto tiene forma de pago fija
      if (producto.formaPago) {
        setFngPaymentOption(producto.formaPago);
      }
    }
  };

  const handleCalcular = () => {
    // Validaciones básicas
    if (!monto || !plazo || !modalidadPago || !productoFNG) {
      setError("❗ Por favor completa todos los campos.");
      return;
    }

    // Validaciones específicas
    const montoNum = parseFloat(monto);
    if (!validateMonto(montoNum) || !validarFondoEspecial()) {
      return;
    }

    const plazoMeses =
      plazo * parametria.configuracionGeneral.modalidadesPago[modalidadPago];
    const producto = parametria.productosFNG[productoFNG];

    // Validar plazos del producto FNG
    if (
      producto.plazos &&
      (plazoMeses < producto.plazos.minimo ||
        plazoMeses > producto.plazos.maximo)
    ) {
      setError(
        `❗ El plazo debe estar entre ${producto.plazos.minimo} y ${producto.plazos.maximo} meses para este producto.`
      );
      return;
    }

    // Validar plazo mínimo general
    if (plazoMeses < PLAZO_MINIMO) {
      setError(`❗ El plazo mínimo debe ser de ${PLAZO_MINIMO} meses.`);
      return;
    }

    // Proceder con el cálculo
    const amort = calcularAmortizacion(
      montoNum,
      interestRate,
      parseInt(plazo, 10),
      modalidadPago
    );

    setAmortizacion(amort);
    setError("");
  };

  const handleReiniciar = () => {
    setMonto("");
    setPlazo("");
    setModalidadPago("Mensual");
    setModalidadCredito("MICROCREDITO");
    setTipologia("RURAL");
    setProductoFNG("");
    setCedula("");
    setTipoCredito("");
    setFngRate(0);
    setMipymeRate(0);
    setInterestRate(0);
    setCostoCentrales(0);
    setMipymePaymentOption("Diferido");
    setMontoError("");
    setCedulaError("");
    setError("");
    setAmortizacion([]);
  };

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
          {/* Modalidad de crédito */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>📋</span>
              <span className="font-semibold">Modalidad de crédito:</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={modalidadCredito}
              onChange={(e) => setModalidadCredito(e.target.value)}
            >
              {Object.keys(parametria.tasasInteres).map((modalidad) => (
                <option key={modalidad} value={modalidad}>
                  {modalidad}
                </option>
              ))}
            </select>
          </div>

          {/* Tipología */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>🏘️</span>
              <span className="font-semibold">Tipología:</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={tipologia}
              onChange={(e) => setTipologia(e.target.value)}
            >
              <option value="RURAL">Rural</option>
              <option value="URBANO">Urbano</option>
            </select>
          </div>

          {/* Producto FNG */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>🏦</span>
              <span className="font-semibold">FNG aplicable:</span>
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={productoFNG}
              onChange={handleProductoFNGChange}
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

          {/* Cédula (si es necesario) */}
          {["EMP080", "EMP280"].includes(productoFNG) && (
            <div className="bg-white p-4 rounded-lg shadow">
              <label className="flex items-center gap-2 mb-2">
                <span>🪪</span>
                <span className="font-semibold">Número de Cédula:</span>
              </label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
                placeholder="Ingrese el número de cédula"
              />
              {cedulaError && (
                <p className="text-red-500 text-sm mt-1">{cedulaError}</p>
              )}
            </div>
          )}

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
              onChange={handleMontoChange}
              min={parametria.configuracionGeneral.montoMinimo}
              step="1000"
              placeholder="Mínimo 1.000.000 COP"
            />
            {montoError && (
              <p className="text-red-500 text-sm mt-1">{montoError}</p>
            )}
          </div>
        </div>

        {/* Segunda columna */}
        <div className="space-y-4">
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
              {Object.keys(parametria.configuracionGeneral.modalidadesPago).map(
                (modalidad) => (
                  <option key={modalidad} value={modalidad}>
                    {modalidad}
                  </option>
                )
              )}
            </select>
          </div>

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

          {/* Forma de Pago MiPyme */}
          <div className="bg-white p-4 rounded-lg shadow">
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

      {/* Tasas y costos */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <p className="mt-1">{SEGURO_VIDA_RATE} COP por cada 1.000 COP</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Consulta Centrales:</span>
            <p className="mt-1">{costoCentrales.toLocaleString("es-CO")} COP</p>
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
                  Centrales
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
                    {parseFloat(cuota.centralesCuota).toLocaleString("es-CO")}
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

export default App;
