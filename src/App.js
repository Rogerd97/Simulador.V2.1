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
// Definir la constante MESES_POR_PERIODO fuera de las funciones
const MESES_POR_PERIODO = {
  Mensual: 1,
  Bimestral: 2,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12,
};
const App = () => {
  // Estados base
  const [monto, setMonto] = useState("");
  const [plazo, setPlazo] = useState("");
  const [modalidadPago, setModalidadPago] = useState("Mensual");
  const [modalidadCredito, setModalidadCredito] = useState("MICROCREDITO");
  const [tipologia, setTipologia] = useState("");
  const [productoFNG, setProductoFNG] = useState("");
  const [cedula, setCedula] = useState("");
  const [tipoCredito, setTipoCredito] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [municipiosDisponibles, setMunicipiosDisponibles] = useState([]);

  // Estados para tasas y comisiones
  const [fngRate, setFngRate] = useState(0);
  const [mipymeRate, setMipymeRate] = useState(0);
  const [interestRate, setInterestRate] = useState(0);
  const [costoCentrales, setCostoCentrales] = useState(0);
  const [fngPaymentOption, setFngPaymentOption] = useState("DIFERIDO");

  // Estados para opciones de pago
  const [mipymePaymentOption, setMipymePaymentOption] = useState("Diferido");

  // Estados para validación y errores
  const [montoError, setMontoError] = useState("");
  const [cedulaError, setCedulaError] = useState("");
  const [error, setError] = useState("");
  const [amortizacion, setAmortizacion] = useState([]);
  const [productosFNGFiltrados, setProductosFNGFiltrados] = useState({});

  // Obtener parametría
  const parametria = getParametria();
  const SEGURO_VIDA_RATE =
    parametria.configuracionGeneral.seguroVida.tasaPorMil;
  const PLAZO_MINIMO = parametria.configuracionGeneral.plazoMinimo;
  const IVA = parametria.configuracionGeneral.iva;

  // Efecto para actualizar municipios cuando cambia el departamento
  useEffect(() => {
    if (departamento) {
      const municipiosDelDepartamento =
        parametria.ubicaciones[departamento] || {};
      setMunicipiosDisponibles(Object.keys(municipiosDelDepartamento));
      setMunicipio(""); // Resetear municipio al cambiar departamento
      setTipologia(""); // Resetear tipología
    }
  }, [departamento]);

  // Efecto para actualizar tipología cuando cambia el municipio
  useEffect(() => {
    if (departamento && municipio) {
      const tipologiaMunicipio =
        parametria.ubicaciones[departamento][municipio];
      setTipologia(tipologiaMunicipio);
    }
  }, [departamento, municipio]);

  // Efecto para filtrar productos FNG según modalidad
  useEffect(() => {
    if (modalidadCredito) {
      if (
        ["CONSUMO", "VEHICULO", "LEY_DE_VICTIMAS"].includes(modalidadCredito)
      ) {
        // Para estas modalidades, solo mostrar opción Sin Garantía
        setProductosFNGFiltrados({
          SIN_GARANTIA: {
            nombre: "Sin Garantía",
            comisionMensual: 0,
            modalidadesPermitidas: ["CONSUMO", "VEHICULO", "LEY_DE_VICTIMAS"],
            tipoComision: "UNICA_ANTICIPADA",
            formaPago: "ANTICIPADO",
            plazos: {
              minimo: 1,
              maximo: 120,
            },
            montos: parametria.modalidades[modalidadCredito].montos,
            requiereIVA: false,
          },
        });
      } else {
        // Para otras modalidades, filtrar productos normalmente
        const productosFiltered = Object.entries(parametria.productosFNG)
          .filter(([_, producto]) =>
            producto.modalidadesPermitidas.includes(modalidadCredito)
          )
          .reduce((acc, [codigo, producto]) => {
            acc[codigo] = producto;
            return acc;
          }, {});

        setProductosFNGFiltrados(productosFiltered);
      }

      // Limpiar producto seleccionado al cambiar modalidad
      setProductoFNG("");
    }
  }, [modalidadCredito]);

  // Efecto para cálculos generales
  // Modificar el efecto que maneja los cálculos generales
  useEffect(() => {
    if (monto && modalidadCredito && tipologia) {
      const montoNum = parseFloat(monto);

      // Validar monto primero
      if (!validateMonto(montoNum)) {
        return;
      }

      console.log("Iniciando cálculos con:", {
        monto: montoNum,
        modalidad: modalidadCredito,
        tipologia,
      });

      // Determinar tipo de crédito
      const nuevoTipoCredito = determinarTipoCredito(montoNum);
      console.log("Tipo de crédito determinado:", nuevoTipoCredito);
      setTipoCredito(nuevoTipoCredito);

      // Obtener tasa de interés
      if (nuevoTipoCredito) {
        const tasaInteres = obtenerTasaInteres(
          montoNum,
          modalidadCredito,
          nuevoTipoCredito,
          tipologia
        );

        console.log(
          "🔎 Tasa de interés obtenida:",
          tasaInteres,
          typeof tasaInteres
        );

        // Verificar si la tasa obtenida es un número válido
        if (
          tasaInteres !== undefined &&
          tasaInteres !== null &&
          !isNaN(tasaInteres)
        ) {
          const tasaNumerica = Number(tasaInteres);
          console.log("✅ Tasa numérica válida:", tasaNumerica);
          setInterestRate(tasaNumerica);
          setError(""); // Limpiar errores previos si todo está bien
        } else {
          console.warn(
            "⚠️ No se pudo determinar la tasa de interés. Valor recibido:",
            tasaInteres
          );
          setInterestRate(0);
          setError(
            "No se pudo determinar la tasa de interés para la combinación seleccionada"
          );
        }
      }

      // Calcular comisión MiPyme
      const comisionMipyme = calcularComisionMipyme(montoNum, modalidadCredito);
      setMipymeRate(comisionMipyme);

      if (productoFNG) {
        const plazoMeses =
          plazo *
          (parametria.configuracionGeneral.modalidadesPago?.[modalidadPago] ||
            1);
        const tasaFNG = calcularTasaFNG(montoNum, plazoMeses);
        console.log("Tasa FNG calculada:", tasaFNG);
        setFngRate(tasaFNG);
      }

      const costosCentrales = calcularCostoCentrales(montoNum);
      console.log("Costos centrales calculados:", costosCentrales);
      setCostoCentrales(costosCentrales);
    }
  }, [monto, modalidadCredito, tipologia, productoFNG, plazo, modalidadPago]);

  const validateMonto = (valor) => {
    if (!modalidadCredito) return false;

    console.log("Validando monto:", valor);

    // Validación específica para productos FNG primero
    if (productoFNG) {
      const productoConfig = parametria.productosFNG[productoFNG];
      if (productoConfig?.montos) {
        if (valor < productoConfig.montos.minimo) {
          setMontoError(
            `❌ El monto para ${
              productoConfig.nombre
            } debe ser mayor a ${productoConfig.montos.minimo.toLocaleString()} COP.`
          );
          return false;
        }
        if (valor > productoConfig.montos.maximo) {
          setMontoError(
            `❌ El monto para ${
              productoConfig.nombre
            } debe ser menor a ${productoConfig.montos.maximo.toLocaleString()} COP.`
          );
          return false;
        }
      }
    }

    // Validación por modalidad
    const modalidadConfig = parametria.modalidades[modalidadCredito];
    if (!modalidadConfig?.montos) return false;

    console.log("Validando contra configuración:", modalidadConfig.montos);

    if (!valor || valor < modalidadConfig.montos.minimo) {
      setMontoError(
        `❌ El monto mínimo para ${modalidadCredito} es de ${modalidadConfig.montos.minimo.toLocaleString()} COP.`
      );
      return false;
    }

    if (valor > modalidadConfig.montos.maximo) {
      setMontoError(
        `❌ El monto máximo para ${modalidadCredito} es de ${modalidadConfig.montos.maximo.toLocaleString()} COP.`
      );
      return false;
    }

    setMontoError("");
    return true;
  };

  const calcularTasaFNG = (monto, plazoMeses) => {
    const producto = parametria.productosFNG[productoFNG];
    if (!producto) return 0;

    if (productoFNG === "SIN_GARANTIA") {
      return 0;
    }

    if (["EMP320", "EMP300", "EMP200"].includes(productoFNG)) {
      return producto.comisionMensual;
    }

    return producto.comisionesPorPlazo?.[plazoMeses] || 0;
  };

  // Manejadores de eventos
  const handleProductoFNGChange = (e) => {
    const nuevoProducto = e.target.value;

    // Limpiar todos los errores primero
    setError("");
    setMontoError("");
    setCedulaError("");

    // Resetear valores si se deselecciona el producto
    if (!nuevoProducto) {
      setProductoFNG("");
      setCedula("");
      setFngRate(0);
      return;
    }

    const montoActual = parseFloat(monto);
    const producto = parametria.productosFNG[nuevoProducto];

    // Actualizar el producto primero
    setProductoFNG(nuevoProducto);

    // Luego hacer las validaciones
    if (montoActual && producto?.montos) {
      if (
        montoActual < producto.montos.minimo ||
        montoActual > producto.montos.maximo
      ) {
        setMontoError(
          `❌ El monto debe estar entre ${producto.montos.minimo.toLocaleString()} y ${producto.montos.maximo.toLocaleString()} COP para ${
            producto.nombre
          }`
        );
      }
    }

    // Configurar forma de pago FNG
    setFngPaymentOption(
      ["EMP320", "EMP300", "EMP200"].includes(nuevoProducto)
        ? "DIFERIDO"
        : "ANTICIPADO"
    );

    // Validación de cédula
    if (["EMP080", "EMP280"].includes(nuevoProducto)) {
      setCedulaError("❌ Este producto requiere validación de cédula.");
    }

    // Recalcular tasa FNG
    if (monto && plazo && modalidadPago) {
      const plazoMeses = parseInt(plazo, 10) * MESES_POR_PERIODO[modalidadPago];
      const nuevaTasaFNG = calcularTasaFNG(montoActual, plazoMeses);
      setFngRate(nuevaTasaFNG);
    }
  };

  const handleCedulaChange = (e) => {
    const nuevaCedula = e.target.value;
    setCedula(nuevaCedula);

    if (["EMP080", "EMP280"].includes(productoFNG)) {
      const validacion = validarCedulaFondoEspecial(nuevaCedula);
      if (!validacion) {
        setCedulaError("❌ La cédula no está autorizada para este fondo.");
      } else if (validacion.fondo !== productoFNG) {
        setCedulaError(
          `❌ La cédula está autorizada para el fondo ${validacion.fondo}`
        );
      } else {
        setCedulaError("");
      }
    }
  };

  const handleMontoChange = (e) => {
    const valor = e.target.value;
    setMonto(valor);

    // Limpiar errores previos
    setMontoError("");
    setError("");

    if (valor) {
      const montoNum = parseFloat(valor);

      // Validar monto
      validateMonto(montoNum);

      // Recalcular tipo de crédito y tasas
      const nuevoTipoCredito = determinarTipoCredito(montoNum);
      if (nuevoTipoCredito) {
        setTipoCredito(nuevoTipoCredito);

        // Actualizar tasa de interés
        const tasas = obtenerTasaInteres(
          montoNum,
          modalidadCredito,
          nuevoTipoCredito,
          tipologia
        );
        if (tasas) {
          setInterestRate(tasas.mv);
        }

        // Actualizar tasa MiPyme
        const comisionMipyme = calcularComisionMipyme(montoNum);
        setMipymeRate(comisionMipyme);

        // Actualizar tasa FNG si hay producto seleccionado
        if (productoFNG && plazo) {
          const plazoMeses =
            parseInt(plazo, 10) * MESES_POR_PERIODO[modalidadPago];
          const nuevaTasaFNG = calcularTasaFNG(montoNum, plazoMeses);
          setFngRate(nuevaTasaFNG);
        }
      }
    }
  };

  // Función para determinar tipo de crédito según monto
  const determinarTipoCredito = (monto) => {
    if (!monto || !modalidadCredito || !tipologia) {
      console.log("Faltan datos para determinar tipo de crédito:", {
        monto,
        modalidadCredito,
        tipologia,
      });
      return "";
    }

    const SMLV = parametria.configuracionGeneral.salarioMinimo;
    const montoEnSMLV = monto / SMLV;

    console.log("Calculando tipo de crédito:", {
      monto,
      SMLV,
      montoEnSMLV,
      modalidadCredito,
      tipologia,
    });

    switch (modalidadCredito) {
      case "MICROCREDITO": {
        let tipo;
        if (montoEnSMLV <= 6) {
          tipo = `POPULAR_${tipologia}`;
        } else if (montoEnSMLV <= 25) {
          tipo = `PRODUCTIVO_${tipologia}`;
        } else {
          tipo = "PRODUCTIVO_MAYOR_MONTO";
        }
        console.log("Tipo de microcrédito determinado:", tipo);
        return tipo;
      }
      case "COMERCIAL":
        return "COMERCIAL";
      case "CONSUMO":
        return "CONSUMO";
      case "VEHICULO":
        return "VEHICULO";
      case "LEY_DE_VICTIMAS":
        return "CONSUMO";
      default:
        return "";
    }
  };

  // Agregar esta función junto a las otras funciones auxiliares
  const ajustarTasaInteresPorPeriodicidad = (tasaMensual, modalidad) => {
    if (!tasaMensual) return 0;

    const MESES_POR_PERIODO = {
      Mensual: 1,
      Bimestral: 2,
      Trimestral: 3,
      Semestral: 6,
      Anual: 12,
    };

    const periodoMeses = MESES_POR_PERIODO[modalidad] || 1;
    return Math.pow(1 + tasaMensual, periodoMeses) - 1;
  };

  const calcularAmortizacion = (
    capital,
    tasaMensual,
    plazoPeriodos,
    modalidad
  ) => {
    console.log("Entrada calcularAmortizacion:", {
      capital,
      tasaMensual,
      plazoPeriodos,
      modalidad,
    });
    // Validaciones iniciales
    if (!capital || !tasaMensual || !plazoPeriodos || !modalidad) {
      setError("❗ Faltan datos requeridos para el cálculo");
      return [];
    }

    // Definición de períodos
    const MESES_POR_PERIODO = {
      Mensual: 1,
      Bimestral: 2,
      Trimestral: 3,
      Semestral: 6,
      Anual: 12,
    };

    const mesesPorPeriodo = MESES_POR_PERIODO[modalidad];
    const tasaPeriodica = Math.pow(1 + tasaMensual, mesesPorPeriodo) - 1;

    // Función auxiliar para calcular comisión MiPyme
    const calcularMipymeCuota = (saldo, mesesTranscurridos, cuotaActual) => {
      const esPrimerMesDelAno = mesesTranscurridos % 12 === 0;

      if (mipymePaymentOption === "Diferido") {
        if (esPrimerMesDelAno) {
          // Calcular comisión anual sobre el saldo actual
          const mipymeAnual = saldo * mipymeRate * (1 + IVA);

          // Calcular cuotas restantes en el año actual
          const cuotasRestantesAno = Math.min(
            Math.ceil(12 / mesesPorPeriodo),
            plazoPeriodos - cuotaActual + 1
          );

          // Ajustar para el último año si es incompleto
          const mesesRestantes =
            plazoPeriodos * mesesPorPeriodo - mesesTranscurridos;
          const factorProporcional = Math.min(mesesRestantes / 12, 1);

          // Distribuir el monto del año actual
          return (mipymeAnual * factorProporcional) / cuotasRestantesAno;
        } else if (
          mesesTranscurridos <
          Math.ceil(mesesTranscurridos / 12) * 12
        ) {
          // Continuar con las cuotas distribuidas del año en curso
          const mipymeAnual =
            (mesesTranscurridos < 12 ? capital : saldo) *
            mipymeRate *
            (1 + IVA);
          const cuotasPorAno = 12 / mesesPorPeriodo;
          return mipymeAnual / cuotasPorAno;
        }
      } else if (mipymePaymentOption === "Anticipado" && esPrimerMesDelAno) {
        // Cobro anticipado al inicio de cada año
        const mesesRestantes =
          plazoPeriodos * mesesPorPeriodo - mesesTranscurridos;
        const factorProporcional = Math.min(mesesRestantes / 12, 1);
        return saldo * mipymeRate * (1 + IVA) * factorProporcional;
      }

      return 0;
    };

    // Cálculo de cuota básica
    const cuotaBasica =
      (capital * tasaPeriodica * Math.pow(1 + tasaPeriodica, plazoPeriodos)) /
      (Math.pow(1 + tasaPeriodica, plazoPeriodos) - 1);
    // Agregar validación
    if (isNaN(cuotaBasica) || !isFinite(cuotaBasica)) {
      setError(
        "❗ Error en el cálculo de la cuota. Verifique las tasas y plazos."
      );
      return [];
    }

    let amortizacion = [];
    let saldo = capital;
    let mesesTranscurridos = 0;

    for (let i = 1; i <= plazoPeriodos; i++) {
      // Cálculo de intereses y capital
      const interesCuota = saldo * tasaPeriodica;
      const capitalCuota = cuotaBasica - interesCuota;

      // Cálculo de FNG
      let fngCuota = 0;
      if (["EMP320", "EMP300", "EMP200"].includes(productoFNG)) {
        // Productos con cobro mensual sobre saldo
        fngCuota =
          saldo *
          parametria.productosFNG[productoFNG].comisionMensual *
          mesesPorPeriodo *
          (1 + IVA);
      } else if (i === 1) {
        // Productos con cobro anticipado
        fngCuota = capital * fngRate * (1 + IVA);
      }

      // Cálculo del seguro de vida
      const seguroVidaCuota = (saldo / 1000) * SEGURO_VIDA_RATE;

      // Cálculo de la comisión MiPyme
      const mipymeCuota = calcularMipymeCuota(saldo, mesesTranscurridos, i);

      // Centrales (solo en primera cuota)
      const centralesCuota = i === 1 ? calcularCostoCentrales(capital) : 0;

      // Cálculo de la cuota total
      const cuotaTotal =
        cuotaBasica + fngCuota + mipymeCuota + seguroVidaCuota + centralesCuota;

      // Actualización del saldo
      saldo = Math.max(0, saldo - capitalCuota);
      mesesTranscurridos += mesesPorPeriodo;

      // Agregar la cuota a la tabla de amortización
      amortizacion.push({
        cuota: i,
        cuotaConstante: Number(cuotaBasica.toFixed(2)),
        capitalCuota: Number(capitalCuota.toFixed(2)),
        interesCuota: Number(interesCuota.toFixed(2)),
        fngCuota: Number(fngCuota.toFixed(2)),
        mipymeCuota: Number(mipymeCuota.toFixed(2)),
        seguroVidaCuota: Number(seguroVidaCuota.toFixed(2)),
        centralesCuota: Number(centralesCuota.toFixed(2)),
        cuotaTotal: Number(cuotaTotal.toFixed(2)),
        saldoRestante: Number(saldo.toFixed(2)),
      });
    }

    return amortizacion;
  };
  const handleCalcular = () => {
    console.log("Valores para cálculo:", {
      montoNum: parseFloat(monto),
      interestRate,
      plazoNum: parseInt(plazo, 10),
      modalidadPago,
    });

    // Validar campos obligatorios
    if (
      !monto ||
      !plazo ||
      !modalidadPago ||
      !productoFNG ||
      !departamento ||
      !municipio
    ) {
      setError("❗ Por favor completa todos los campos obligatorios.");
      return;
    }

    // Validar cédula para productos específicos
    if (["EMP080", "EMP280"].includes(productoFNG) && !cedula) {
      setError("❗ La cédula es requerida para este producto.");
      return;
    }

    const montoNum = parseFloat(monto);
    const plazoNum = parseInt(plazo, 10);

    // Validar que los números sean válidos
    if (isNaN(montoNum) || isNaN(plazoNum)) {
      setError("❗ El monto y el plazo deben ser valores numéricos válidos.");
      return;
    }

    // Validar monto según modalidad y producto FNG
    if (!validateMonto(montoNum)) {
      // No necesitamos setear error aquí porque validateMonto ya lo hace
      return;
    }

    // Validar plazo mínimo y producto FNG
    const plazoMeses = plazoNum * MESES_POR_PERIODO[modalidadPago];
    const productoConfig = parametria.productosFNG[productoFNG];

    if (productoConfig?.plazos) {
      if (plazoMeses < productoConfig.plazos.minimo) {
        setError(
          `❗ El plazo mínimo para ${productoConfig.nombre} es de ${productoConfig.plazos.minimo} meses.`
        );
        return;
      }
      if (plazoMeses > productoConfig.plazos.maximo) {
        setError(
          `❗ El plazo máximo para ${productoConfig.nombre} es de ${productoConfig.plazos.maximo} meses.`
        );
        return;
      }
    }

    // Validar que tengamos tasa de interés
    if (!interestRate) {
      setError(
        "❗ No se pudo determinar la tasa de interés. Verifique los datos ingresados."
      );
      return;
    }

    try {
      const amort = calcularAmortizacion(
        montoNum,
        interestRate,
        plazoNum,
        modalidadPago
      );

      if (!amort || amort.length === 0) {
        setError("❗ No se pudo generar la tabla de amortización.");
        return;
      }

      setAmortizacion(amort);
      setError(""); // Limpiar cualquier error previo
    } catch (err) {
      console.error("Error en cálculo:", err);
      setError(`❗ Error al calcular la amortización: ${err.message}`);
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">💰</span>
        <h1 className="text-2xl md:text-3xl font-bold">
          Simulador de Créditos
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Primera columna */}
        <div className="space-y-4">
          {/* Ubicación */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>📍</span>
              <span className="font-semibold">Ubicación:</span>
            </label>
            <div className="space-y-2">
              <select
                className="w-full p-2 border rounded-md"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                required
              >
                <option value="">-- Seleccione Departamento --</option>
                {Object.keys(parametria.ubicaciones).map((dep) => (
                  <option key={dep} value={dep}>
                    {dep.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <select
                className="w-full p-2 border rounded-md"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                disabled={!departamento}
                required
              >
                <option value="">-- Seleccione Municipio --</option>
                {municipiosDisponibles.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              required
            >
              {Object.keys(parametria.tasasInteres).map((modalidad) => (
                <option key={modalidad} value={modalidad}>
                  {modalidad}
                </option>
              ))}
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
              required
            >
              <option value="">-- Seleccione un producto --</option>
              {Object.entries(productosFNGFiltrados).map(
                ([codigo, producto]) => (
                  <option key={codigo} value={codigo}>
                    {producto.nombre} ({codigo})
                  </option>
                )
              )}
            </select>
          </div>

          {/* Campo de cédula condicional */}
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
                onChange={handleCedulaChange}
                placeholder="Ingrese el número de cédula"
                required
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
              min="1000000"
              step="1000"
              placeholder="Ingrese el monto del crédito"
              required
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
              required
            >
              <option value="Mensual">Mensual</option>
              <option value="Bimestral">Bimestral</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
          {/* Plazo */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>⌛</span>
              <span className="font-semibold">Número de períodos:</span>
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded-md"
              value={plazo}
              onChange={(e) => setPlazo(e.target.value)}
              min="1"
              placeholder="Ingrese el número de períodos"
              required
            />
          </div>

          {/* Tipología (solo mostrar) */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>🏘️</span>
              <span className="font-semibold">Tipología:</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-gray-100"
              value={tipologia}
              readOnly
            />
          </div>
          {/* Agregar después del campo de tipología */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label className="flex items-center gap-2 mb-2">
              <span>📝</span>
              <span className="font-semibold">Tipo de Crédito:</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md bg-gray-100"
              value={tipoCredito || ""}
              readOnly
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
        <h2 className="text-lg font-semibold mb-3">💹 Tasas y Costos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-sm">
            <span className="font-semibold">Valores de cálculo:</span>
            <p className="mt-1">
              Monto: {parseFloat(monto).toLocaleString("es-CO")}
            </p>
            <p className="mt-1">Plazo: {plazo} períodos</p>
            <p className="mt-1">Modalidad: {modalidadPago}</p>
            <p className="mt-1">
              Tasa MV:{" "}
              {isNaN(interestRate)
                ? "No disponible"
                : (interestRate * 100).toFixed(4) + "%"}
              %
            </p>
          </div>
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
            <p className="mt-1">{SEGURO_VIDA_RATE} por mil</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Consulta Centrales:</span>
            <p className="mt-1">{costoCentrales.toLocaleString("es-CO")} COP</p>
          </div>

          <div className="text-sm">
            <span className="font-semibold">Tipo de Crédito:</span>
            <p className="mt-1">{tipoCredito || "-"}</p>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleCalcular}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          disabled={
            !monto ||
            !plazo ||
            !modalidadPago ||
            !productoFNG ||
            !departamento ||
            !municipio
          }
        >
          Calcular Amortización
        </button>
        <button
          onClick={() => {
            setMonto("");
            setPlazo("");
            setModalidadPago("Mensual");
            setModalidadCredito("MICROCREDITO");
            setTipologia("");
            setProductoFNG("");
            setCedula("");
            setDepartamento("");
            setMunicipio("");
            setAmortizacion([]);
            setError("");
          }}
          className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
        >
          Limpiar Formulario
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

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
                  Seguro Vida
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Centrales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {amortizacion.map((cuota, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{cuota.cuota}</td>
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
