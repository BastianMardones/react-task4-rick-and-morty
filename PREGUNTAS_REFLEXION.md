# Preguntas de reflexión

_Escribe tus respuestas debajo de cada pregunta._

**Alumno:** Bastián Mardones

---

## Paso 1 · Explorando la API

| Pregunta | Mi respuesta |
|---|---|
| ¿Cuántos personajes trae cada página? | 20 personajes. |
| ¿Qué campo me dice si existe una página siguiente? | `info.next`. |
| ¿Qué valor tiene ese campo en la última página? | `null`. |
| ¿Qué código HTTP devuelve una búsqueda sin resultados? | `404`. |
| ¿Qué campos del personaje usa `CharacterCard`? | `name`, `status`, `species` e `image`. |

## Paso 2 · Petición HTTP

**¿Qué diferencia hay entre que `fetch` "falle" y que el servidor responda con un error? ¿Qué debo revisar en la respuesta?**

> `fetch` solo rechaza su promesa cuando ocurre un fallo de red o de conexión; si el servidor responde con un error HTTP como `404` o `500`, la promesa se resuelve normalmente con un objeto `Response`. Por eso hay que revisar `response.status` (para tratar `404` como búsqueda sin resultados) y `response.ok` para lanzar un `Error` cuando la respuesta no sea exitosa.

## Paso 3 · Estado

**¿Por qué guardo los personajes en estado y no en una variable normal?**

> Porque cambiar una variable normal no le notifica a React que debe volver a renderizar el componente y las variables locales se reinician en cada render. Con `useState`, React conserva los datos entre renders y actualiza la pantalla al llamar al setter.

## Paso 4 · useEffect

1. **¿Qué pasa si omito por completo el arreglo de dependencias?**

> El efecto se ejecuta después de cada render del componente; como adentro actualiza el estado, provoca otro render y entra en un bucle infinito de peticiones.

2. **¿Qué significa dejar el arreglo vacío?**

> Significa que el efecto no depende de ningún valor reactivo y se ejecuta una sola vez al montar el componente.

3. **¿Por qué la función que recibe `useEffect` no debe ser `async` directamente?**

> Porque una función `async` siempre devuelve una `Promise`, pero `useEffect` espera recibir `undefined` o una función de limpieza síncrona; para usar `await`, se define e invoca una función `async` dentro del efecto.

## Paso 5 · FlatList

1. **¿Para qué sirve la prop que extrae la llave de cada elemento?**

> `keyExtractor` entrega un identificador único en formato `string` para cada elemento (`String(item.id)`), permitiendo a React rastrear qué filas cambian o se agregan sin duplicados ni re-renderizados innecesarios.

2. **¿Por qué usar `FlatList` en lugar de un `ScrollView` con `.map()`?**

> `ScrollView` monta todos los elementos de una sola vez en memoria, mientras que `FlatList` virtualiza la lista renderizando solo los elementos visibles y ofrece soporte nativo para paginación, *pull to refresh*, separadores y lista vacía.

## Paso 6 · Carga y error

**¿Por qué es mejor mostrar un mensaje con un botón "Reintentar" que dejar la pantalla vacía?**

> Porque informa al usuario que hubo un fallo en lugar de parecer que la app se congeló y le da una acción directa para volver a intentar la carga sin reiniciar la aplicación.

## Paso 8 · Paginación

**¿Qué problema aparece si la función de "cargar más" se dispara varias veces seguidas? ¿Cómo lo evité?**

> Se lanzan peticiones repetidas de la misma página, generando personajes duplicados y advertencias de llaves repetidas. Lo evité bloqueando la función mientras está cargando (`loading`, `loadingMore`, `refreshing`, `isLoadingMoreRef`), cuando `!hasNextPage` o cuando hay un error activo, y filtrando posibles `id` duplicados al concatenar.

## Paso 9 · Pull to refresh

**¿Por qué usé un estado distinto (`refreshing`) y no el mismo de la carga inicial?**

> Porque `loading` reemplaza toda la vista por un spinner al no haber datos aún, mientras que `refreshing` mantiene los personajes visibles en pantalla y muestra el indicador nativo superior de `FlatList` al recargar la página 1.

## Paso 10 · Búsqueda

1. **¿Qué es el debounce y qué problema resuelve?**

> Es una pausa después de la última pulsación (`500 ms` con `DEBOUNCE_MS`) antes de lanzar la búsqueda, evitando hacer una petición HTTP por cada letra que escribe el usuario.

2. **¿Para qué sirve la función de limpieza (cleanup) que se devuelve en un `useEffect`? Da un ejemplo de esta práctica.**

> Sirve para cancelar tareas pendientes antes de volver a ejecutar el efecto o al desmontar el componente. En esta práctica se usa para cancelar el temporizador anterior con `clearTimeout` y para marcar una petición previa como obsoleta (`isCancelled = true`).

3. **Si el usuario escribe rápido y las respuestas llegan en desorden, ¿qué podría salir mal?**

> Una respuesta anterior más lenta podría llegar después que la más reciente y sobrescribir la lista con resultados desactualizados; se evita ignorando respuestas cuya bandera de limpieza o versión ya no corresponda a la búsqueda vigente.

## Cierre

**Menciona dos mejoras que le harías a la app si tuvieras una hora más:**

> 1. Usar `AbortController` para cancelar a nivel de red las peticiones anteriores cuando cambia la búsqueda.
> 2. Agregar filtros por estado (`Alive`, `Dead`, `unknown`) y una vista de detalle al tocar una tarjeta.
