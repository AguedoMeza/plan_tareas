// Archivo separado para los datos de proyectos
window.proyectosData = [
    {
        nombre: "Nintex",
        descripcion: "Proyecto general de integración y servicios Nintex",
        recuento: 1,
        tareas: [
            {
                nombre: "Nintex-MRI Connector",
                descripcion: "Conector entre Nintex y MRI para sincronización de vendors y webhooks",
                prioridad: 1,
                avance: "",
                esfuerzo: "",
                deadline: "",
                estado: "En progreso",
                subtareas: [
                    {
                        nombre: "MRI Connector Service",
                        descripcion: "",
                        prioridad: 1,
                        avance: "100%",
                        esfuerzo: "4d",
                        deadline: "",
                        estado: "Completado"
                    },
                    {
                        nombre: "Modelos y BD Local",
                        descripcion: "",
                        prioridad: 2,
                        avance: "80%",
                        esfuerzo: "2d",
                        deadline: "",
                        estado: "En progreso"
                    },
                    {
                        nombre: "Vendor Service + Endpoints",
                        descripcion: "",
                        prioridad: 2,
                        avance: "70%",
                        esfuerzo: "1d",
                        deadline: "",
                        estado: "En progreso"
                    },
                    {
                        nombre: "Placeholder para Nintex",
                        descripcion: "",
                        prioridad: 2,
                        avance: "0%",
                        esfuerzo: "1d",
                        deadline: "",
                        estado: "Bloqueado"
                    },
                    {
                        nombre: "Infra",
                        descripcion: "",
                        prioridad: 2,
                        avance: "0%",
                        esfuerzo: "1d",
                        deadline: "",
                        estado: "Pendiente"
                    }
                ]
            },
            {
                nombre: "Diseño de infraestructura para guardado de documentos en nintex",
                descripcion: "",
                prioridad: 2,
                avance: "",
                esfuerzo: "2d",
                deadline: "",
                estado: "Pendiente"
            }
        ]
    },
    {
        nombre: "Reportes CAFS",
        descripcion: "Integración y desarrollo de reportes CAFS (SharePoint, K2, AD, Excel)",
        recuento: 6,
        tareas: [
            {
                nombre: "Integración SharePoint API",
                descripcion: "",
                prioridad: 1,
                avance: "100%",
                esfuerzo: "3d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Integración K2 API",
                descripcion: "",
                prioridad: 1,
                avance: "100%",
                esfuerzo: "3d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Integración correos Directorio Activo",
                descripcion: "",
                prioridad: 1,
                avance: "100%",
                esfuerzo: "2d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Desarrollo de reporte Excel para DAM",
                descripcion: "",
                prioridad: 2,
                avance: "100%",
                esfuerzo: "2d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Desarrollo de reporte Excel para departamentos",
                descripcion: "",
                prioridad: 2,
                avance: "100%",
                esfuerzo: "2d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Infra y despliegue",
                descripcion: "",
                prioridad: 2,
                avance: "100%",
                esfuerzo: "2d",
                deadline: "",
                estado: "Completado"
            }
        ]
    },
    {
        nombre: "Admin Usuarios & Apps",
        descripcion: "Administración de usuarios, roles y aplicaciones",
        recuento: 4,
        tareas: [
            {
                nombre: "Mockup",
                descripcion: "Diseño de pantallas UI",
                prioridad: 3,
                avance: "",
                esfuerzo: "2d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Home/Launcher",
                descripcion: "pantalla inicial para administrar y acceder a múltiples apps, con navegación lateral o superior.",
                prioridad: 3,
                avance: "",
                esfuerzo: "4d",
                deadline: "",
                estado: "Pendiente"
            },
            {
                nombre: "Modelo Entidad Relación",
                descripcion: "roles, modules, applications, pivotes.",
                prioridad: 3,
                avance: "",
                esfuerzo: "1d",
                deadline: "",
                estado: "Pendiente"
            },
            {
                nombre: "UI asignación App+Rol",
                descripcion: "Pantalla mínima para vincular usuario ↔ aplicación ↔ rol.",
                prioridad: 3,
                avance: "",
                esfuerzo: "3d",
                deadline: "",
                estado: "Pendiente"
            }
        ]
    },
    {
        nombre: "WHSE Seguridad",
        descripcion: "Sistema de seguridad y gestión de accesos",
        recuento: 6,
        tareas: [
            {
                nombre: "Renombrar pestaña",
                descripcion: "Cambiar \"React App\" → \"MPA Web Application\".",
                prioridad: 1,
                avance: "100%",
                esfuerzo: "1d",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Integración Reporte WHSE POWER BI",
                descripcion: "Pestaña visible con tarjetas de reportes",
                prioridad: 2,
                avance: "",
                esfuerzo: "1s",
                deadline: "",
                estado: "Completado"
            },
            {
                nombre: "Catálogo buildings",
                descripcion: "crear catálogo propio con constraint de unicidad, UI para asignar muchas propiedades a la vez (filtrar por ciudad \"Guadalajara\", seleccionar \"todas\", etc.).",
                prioridad: "",
                avance: "",
                esfuerzo: "1d",
                deadline: "",
                estado: "Pendiente"
            },
            {
                nombre: "Pantalla para asignación de buildings",
                descripcion: "filtro por ciudad, \"Seleccionar todos\" y buscador dinámico",
                prioridad: "",
                avance: "",
                esfuerzo: "4d",
                deadline: "",
                estado: "Pendiente"
            },
            {
                nombre: "Catálogo Contratistas",
                descripcion: "Crear catálogo con campo capturable con trim, mayúsculas, sin acentos. dedupe básico.",
                prioridad: "",
                avance: "",
                esfuerzo: "1d",
                deadline: "",
                estado: "Pendiente"
            },
            {
                nombre: "Catálogo Actividades + Riesgo",
                descripcion: "Esperando definición de requerimientos del cliente",
                prioridad: "",
                avance: "",
                esfuerzo: "2d",
                deadline: "",
                estado: "Bloqueado"
            }
        ]
    },
    {
        nombre: "InterFlow Migración",
        descripcion: "Migración de API productiva que conecta a MRI",
        recuento: 1,
        tareas: [
            {
                nombre: "Migración de Código a nuevo Azure",
                descripcion: "",
                prioridad: "",
                avance: "60%",
                esfuerzo: "",
                deadline: "",
                estado: "En progreso"
            }
        ]
    }
    ,
   
];
