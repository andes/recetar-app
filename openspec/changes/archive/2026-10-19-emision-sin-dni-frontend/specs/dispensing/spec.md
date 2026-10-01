# Spec Delta

## MODIFIED Requirements

### Requirement: Busqueda de recetas
El frontend SHALL buscar con un retardo de 500 ms. Un termino de 6 a 8 digitos SHALL buscar por DNI; cualquier otro termino SHALL buscar por nombre de paciente, codigo de receta o texto. Las recetas de pacientes sin DNI SHALL poder encontrarse por nombre y SHALL mostrarse con la leyenda “Sin DNI”. SHALL ofrecer limpiar la busqueda.

#### Scenario: Busqueda por DNI
- **WHEN** el usuario escribe un termino de 6 a 8 digitos
- **THEN** el frontend busca las recetas del paciente con ese DNI

#### Scenario: Busqueda general
- **WHEN** el usuario escribe un termino que no es un DNI
- **THEN** el frontend busca por nombre, codigo o texto

#### Scenario: Paciente sin DNI
- **WHEN** el usuario busca por el nombre de un paciente sin DNI
- **THEN** el frontend muestra sus recetas con la leyenda “Sin DNI”

#### Scenario: Limpiar busqueda
- **WHEN** el usuario limpia el texto de busqueda
- **THEN** el frontend recarga el listado con los filtros actuales y vuelve a la primera pagina

### Requirement: Vista previa de receta
El frontend SHALL mostrar cada receta con origen, medicamento, paciente, fecha y estado. Cuando el paciente no tenga DNI SHALL mostrar “Sin DNI” en lugar del documento. Al seleccionar una receta SHALL abrir un panel de detalle con paciente, DNI o “Sin DNI”, sexo, cobertura, profesional, matricula, organizacion, medicamento, unidades, diagnostico, indicaciones, estado, fechas y datos de dispensacion o reemplazo. Al recibir resultados SHALL seleccionar la primera receta como referencia.

#### Scenario: Seleccion de receta
- **WHEN** el usuario selecciona una receta del listado
- **THEN** el frontend abre el panel de detalle con sus datos

#### Scenario: Primera receta preseleccionada
- **WHEN** el listado se carga y no hay una receta seleccionada valida
- **THEN** el frontend toma la primera receta como referencia

#### Scenario: Origen de la receta
- **WHEN** la receta proviene de ANDES o es local
- **THEN** el frontend identifica la fuente y adapta los datos mostrados

#### Scenario: Paciente sin DNI en la vista previa
- **WHEN** la receta pertenece a un paciente sin DNI
- **THEN** el frontend muestra “Sin DNI” en el listado y en el panel de detalle
