package com.example.recipe_api;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Dtos.DishIngredientRequestDto;
import com.example.recipe_api.Dish.Dtos.DishRequestDto;
import com.example.recipe_api.Dish.Enums.DishCategory;
import com.example.recipe_api.Dish.Repositories.DishRepository;
import com.example.recipe_api.Product.Entities.Product;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;
import com.example.recipe_api.Product.Repositories.ProductRepository;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DishTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private DishRepository dishRepository;

    private Product veganProduct;
    private Product meatProduct;
    private Product apple;
    private Product beef;

    @BeforeEach
    void setUp() {
        dishRepository.deleteAll();
        productRepository.deleteAll();

        veganProduct = Product.builder()
                .name("Морковь")
                .calories(41.0).proteins(0.9).fats(0.2).carbs(9.6)
                .flags(List.of(Flag.VEGAN, Flag.NO_SUGAR))
                .build();

        meatProduct = Product.builder()
                .name("Курица")
                .calories(165.0).proteins(31.0).fats(3.6).carbs(0.0)
                .flags(List.of(Flag.NO_SUGAR))
                .build();

        apple = Product.builder()
                .name("Яблоко зеленое")
                .calories(52.0).proteins(0.3).fats(0.2).carbs(14.0)
                .category(ProductCategory.FROZEN) 
                .readiness(Readiness.READY)
                .flags(List.of(Flag.VEGAN, Flag.GLUTEN_FREE))
                .build();

        beef = Product.builder()
                .name("Говядина")
                .calories(250.0).proteins(26.0).fats(15.0).carbs(0.0)
                .category(ProductCategory.MEAT)
                .readiness(Readiness.NEEDS_COOKING)
                .flags(List.of(Flag.NO_SUGAR))
                .build();

        productRepository.saveAll(List.of(apple, beef, veganProduct, meatProduct));
    }

    @Test
    @DisplayName("Флаг VEGAN удаляется, если в составе есть продукт животного происхождения")
    void shouldStripVeganFlagWhenMixedIngredients() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Салат с курицей");
        dto.setFlags(List.of(Flag.VEGAN, Flag.NO_SUGAR));

        DishIngredientRequestDto ing1 = new DishIngredientRequestDto();
        ing1.setProductId(veganProduct.getId());
        ing1.setAmount(100);

        DishIngredientRequestDto ing2 = new DishIngredientRequestDto();
        ing2.setProductId(meatProduct.getId());
        ing2.setAmount(100);

        dto.setIngredients(List.of(ing1, ing2));

        MockMultipartFile dtoPart = createDtoPart(dto);

        MvcResult result = mockMvc.perform(multipart("/api/dishes").file(dtoPart))
                .andExpect(status().isOk())
                .andReturn();
        String jsonResponse = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        DocumentContext json = JsonPath.parse(jsonResponse);

        assertAll("Проверка бизнес-логики флагов",
            () -> assertEquals(1, (Integer) json.read("$.flags.length()"), "Должен остаться только один флаг"),
            () -> assertEquals("Без сахара", json.read("$.flags[0]"), "Должен остаться разрешенный флаг SUGAR_FREE"),
            () -> assertFalse(jsonResponse.contains("ВЕГАН"), "Флаг VEGAN должен быть полностью удален")
        );
    }

    @ParameterizedTest(name = "Вес = {0}г -> Калории = {1}")
    @CsvSource({"0, 0.0", "1, 1.65", "200, 330.0"})
    @DisplayName("BVA: Расчет калорий на основе веса (PostgreSQL)")
    void shouldCalculateMacrosBasedOnAmount(double amount, double expectedCalories) throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Тестовое мясо");
        
        DishIngredientRequestDto ing = new DishIngredientRequestDto();
        ing.setProductId(meatProduct.getId());
        ing.setAmount(amount);
        dto.setIngredients(List.of(ing));

        MvcResult result = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        Double actualCalories = JsonPath.read(json, "$.calories");

        assertEquals(expectedCalories, actualCalories, 0.001, "Погрешность в расчете калорий превышает допустимую");
    }
    
    @ParameterizedTest(name = "Поиск по: {0}. Ожидаем статус 200.")
    @MethodSource("provideFilterArguments")
    @DisplayName("EP: Фильтрация блюд через API (работа со Specifications)")
    void shouldFilterDishes(String testDescription, String searchParam, String expectedName) throws Exception {
        String uniqueName = expectedName + " " + System.currentTimeMillis();
        
        DishRequestDto dto = new DishRequestDto();
        dto.setName(uniqueName);
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto))).andExpect(status().isOk());

        MvcResult result = mockMvc.perform(get("/api/dishes")
                .param("search", searchParam)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        List<String> foundNames = JsonPath.read(json, "$[*].name");

        boolean isFound = foundNames.stream()
                .anyMatch(name -> name.equalsIgnoreCase(uniqueName));

        assertTrue(isFound, "Блюдо должно быть найдено по фильтру: " + searchParam);
    }
    @Test
    @DisplayName("EP: Сложная фильтрация по массиву флагов и категорий")
    void shouldFilterDishesByComplexParameters() throws Exception {
        DishRequestDto dish1 = new DishRequestDto();
        dish1.setName("Овощной суп");
        dish1.setCategory(DishCategory.SOUP);
        DishIngredientRequestDto ing1 = new DishIngredientRequestDto();
        ing1.setProductId(veganProduct.getId());
        ing1.setAmount(100);
        dish1.setIngredients(List.of(ing1));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dish1)));

        DishRequestDto dish2 = new DishRequestDto();
        dish2.setName("Мясной пирог");
        dish2.setCategory(DishCategory.DESSERT);
        DishIngredientRequestDto ing2 = new DishIngredientRequestDto();
        ing2.setProductId(meatProduct.getId());
        ing2.setAmount(100);
        dish2.setIngredients(List.of(ing2));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dish2)));


        mockMvc.perform(get("/api/dishes")
                .param("categories", "Суп")
                .param("flags", "Веган")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Овощной суп"));
    }

    @Test
    @DisplayName("API: Ошибка при создании блюда с несуществующим продуктом")
    void shouldReturnErrorWhenIngredientProductDoesNotExist() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Странное блюдо");

        DishIngredientRequestDto invalidIng = new DishIngredientRequestDto();
        invalidIng.setProductId("123e4567-e89b-12d3-a456-426614174000");
        invalidIng.setAmount(100);
        dto.setIngredients(List.of(invalidIng));

        MockMultipartFile dtoPart = createDtoPart(dto);

        Exception exception = assertThrows(Exception.class, () -> {
            mockMvc.perform(multipart("/api/dishes").file(dtoPart));
        });

        String errorMessage = exception.getCause() != null ? 
                              exception.getCause().getMessage() : 
                              exception.getMessage();

        assertTrue(errorMessage.contains("Продукт не найден"), 
                "Ожидалась ошибка с текстом 'Продукт не найден', но получили: " + errorMessage);
    }

    @Test
    @DisplayName("API: Успешное получение блюда по ID")
    void shouldGetDishById() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Суп тестовый");
        
        DishIngredientRequestDto ing = new DishIngredientRequestDto();
        ing.setProductId(veganProduct.getId());
        ing.setAmount(150);
        dto.setIngredients(List.of(ing));

        String createResponse = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        
        String dishId = JsonPath.read(createResponse, "$.id");

        mockMvc.perform(get("/api/dishes/{id}", dishId)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dishId))
                .andExpect(jsonPath("$.name").value("Суп тестовый"));
    }
    @Test
    @DisplayName("API: Ошибка 404 при запросе несуществующего блюда")
    void shouldReturn404WhenDishNotFound() throws Exception {
        mockMvc.perform(get("/api/dishes/{id}", "non-existent-uuid")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("API: Успешное обновление блюда")
    void shouldUpdateDish() throws Exception {
        DishRequestDto createDto = new DishRequestDto();
        createDto.setName("Старое имя");
        DishIngredientRequestDto ing1 = new DishIngredientRequestDto();
        ing1.setProductId(veganProduct.getId());
        ing1.setAmount(100);
        createDto.setIngredients(List.of(ing1));

        String createResponse = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(createDto)))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String dishId = JsonPath.read(createResponse, "$.id");

        DishRequestDto updateDto = new DishRequestDto();
        updateDto.setName("Новое имя");
        DishIngredientRequestDto ing2 = new DishIngredientRequestDto();
        ing2.setProductId(meatProduct.getId());
        ing2.setAmount(100);
        updateDto.setIngredients(List.of(ing1, ing2));

        mockMvc.perform(multipart("/api/dishes/{id}", dishId)
                .file(createDtoPart(updateDto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Новое имя"))
                .andExpect(jsonPath("$.ingredients.length()").value(2));
    }
    @Test
    @DisplayName("API: Успешное удаление блюда")
    void shouldDeleteDish() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Блюдо на удаление");
        
        String createResponse = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String dishId = JsonPath.read(createResponse, "$.id");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/dishes/{id}", dishId))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/dishes/{id}", dishId))
                .andExpect(status().isNotFound());
    }
    @Test
    @DisplayName("API: Поиск блюд, содержащих определенный продукт")
    void shouldGetDishesByProduct() throws Exception {
        DishRequestDto dishWithMeat = new DishRequestDto();
        dishWithMeat.setName("Куриный суп");
        DishIngredientRequestDto meatIng = new DishIngredientRequestDto();
        meatIng.setProductId(meatProduct.getId());
        meatIng.setAmount(100);
        dishWithMeat.setIngredients(List.of(meatIng));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dishWithMeat)));

        DishRequestDto dishWithCarrot = new DishRequestDto();
        dishWithCarrot.setName("Морковный фреш");
        DishIngredientRequestDto carrotIng = new DishIngredientRequestDto();
        carrotIng.setProductId(veganProduct.getId());
        carrotIng.setAmount(100);
        dishWithCarrot.setIngredients(List.of(carrotIng));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dishWithCarrot)));

        mockMvc.perform(get("/api/dishes/product/{productId}", meatProduct.getId())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Куриный суп"));
    }


    @Test
    @DisplayName("API: Успешная загрузка фото при создании блюда")
    void shouldUploadPhotosSuccessfully() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Блюдо с фото");

        MockMultipartFile photoFile = new MockMultipartFile(
                "files", "test.jpg", MediaType.IMAGE_JPEG_VALUE, "fake-image-content".getBytes()
        );
        mockMvc.perform(multipart("/api/dishes")
                .file(createDtoPart(dto))
                .file(photoFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos").isArray())
                .andExpect(jsonPath("$.photos.length()").value(1))
                .andExpect(jsonPath("$.photos[0]").isString());
    }
    @Test
    @DisplayName("BVA: Ошибка 400 при загрузке более 5 фото")
    void shouldReturn400WhenUploadingMoreThan5Photos() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Слишком много фото");

        var requestBuilder = multipart("/api/dishes").file(createDtoPart(dto));
        for (int i = 0; i < 6; i++) {
            requestBuilder.file(new MockMultipartFile(
                    "files", "test" + i + ".jpg", MediaType.IMAGE_JPEG_VALUE, "content".getBytes()
            ));
        }

        mockMvc.perform(requestBuilder)
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("API: Должен правильно обрабатывать несколько макросов")
    void shouldApplyFirstMacroWhenMultipleMacrosPresent() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Странное блюдо !суп !десерт");
        
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Суп"))
                .andExpect(jsonPath("$.name").value("Странное блюдо"));
    }

    @Test
    @DisplayName("API: Выбранная вручную категория должна перевешивать макрос")
    void shouldPrioritizeFormCategoryOverMacro() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Сладкий суп !суп");
        dto.setCategory(DishCategory.DESSERT);

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("Десерт"))
                .andExpect(jsonPath("$.name").value("Сладкий суп"));
    }

    @Test
    @DisplayName("API: Должен использовать введенные вручную КБЖУ")
    void shouldUseManualMacrosWhenProvided() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Блюдо с ручными КБЖУ");
        dto.setCalories(999.0);
        dto.setProteins(50.0);
        dto.setFats(40.0);
        dto.setCarbs(10.0);

        DishIngredientRequestDto ing = new DishIngredientRequestDto();
        ing.setProductId(veganProduct.getId());
        ing.setAmount(100);
        dto.setIngredients(List.of(ing));

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(999.0))
                .andExpect(jsonPath("$.proteins").value(50.0));
    }

    @Test
    @DisplayName("API: Должен пересчитывать КБЖУ при обновлении")
    void shouldRecalculateMacrosOnUpdate() throws Exception {
        DishRequestDto createDto = new DishRequestDto();
        createDto.setName("Блюдо для обновления");
        DishIngredientRequestDto ing = new DishIngredientRequestDto();
        ing.setProductId(meatProduct.getId());
        ing.setAmount(100);
        createDto.setIngredients(List.of(ing));

        String response = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(createDto)))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String dishId = JsonPath.read(response, "$.id");

        DishRequestDto updateDto = new DishRequestDto();
        updateDto.setName("Блюдо для обновления");
        DishIngredientRequestDto updatedIng = new DishIngredientRequestDto();
        updatedIng.setProductId(meatProduct.getId());
        updatedIng.setAmount(200);
        updateDto.setIngredients(List.of(updatedIng));

        mockMvc.perform(multipart("/api/dishes/{id}", dishId)
                .file(createDtoPart(updateDto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(330.0));
    }

    @Test
    @DisplayName("API: Сброс флагов блюда, когда один из продуктов не имеет флагов")
    void shouldResetFlagsWhenIngredientWithoutFlagsAdded() throws Exception {
        Product plainProduct = Product.builder()
                .name("Вода").calories(0.0).proteins(0.0).fats(0.0).carbs(0.0)
                .build();
        productRepository.save(plainProduct);

        DishRequestDto dto = new DishRequestDto();
        dto.setName("Суп на воде");
        
        DishIngredientRequestDto ing1 = new DishIngredientRequestDto();
        ing1.setProductId(veganProduct.getId());
        ing1.setAmount(100);
        
        DishIngredientRequestDto ing2 = new DishIngredientRequestDto();
        ing2.setProductId(plainProduct.getId());
        ing2.setAmount(100);
        
        dto.setIngredients(List.of(ing1, ing2));

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flags").isEmpty());
    }

    @Test
    @DisplayName("API: Отсутствие флагов при пустом массиве ингридиентов")
    void shouldReturnEmptyFlagsWhenNoIngredients() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Пустое блюдо");
        dto.setIngredients(List.of());

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.flags").isEmpty());
    }

    @Test
    @DisplayName("API: Правильный подсчет КБЖУ для пустого списка ингридиентов")
    void shouldReturnZeroMacrosWhenNoIngredients() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Пустое блюдо 2");
        dto.setIngredients(null);

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calories").value(0.0))
                .andExpect(jsonPath("$.proteins").value(0.0));
    }

    @Test
    @DisplayName("API: Игнорирование пустых файлов")
    void shouldIgnoreEmptyFilesDuringUpload() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Блюдо с пустым файлом");

        MockMultipartFile emptyFile = new MockMultipartFile(
                "files", "empty.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[0]
        );

        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)).file(emptyFile))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos").isEmpty());
    }

    @Test
    @DisplayName("API: Сохранение фото при обновлении")
    void shouldKeepExistingPhotosOnUpdate() throws Exception {
        DishRequestDto createDto = new DishRequestDto();
        createDto.setName("Блюдо с фото");
        MockMultipartFile photo = new MockMultipartFile("files", "1.jpg", MediaType.IMAGE_JPEG_VALUE, "123".getBytes());
        
        String response = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(createDto)).file(photo))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        
        String dishId = JsonPath.read(response, "$.id");
        String photoUrl = JsonPath.read(response, "$.photos[0]");

        DishRequestDto updateDto = new DishRequestDto();
        updateDto.setName("Обновленное блюдо");
        updateDto.setPhotos(List.of(photoUrl));

        mockMvc.perform(multipart("/api/dishes/{id}", dishId)
                .file(createDtoPart(updateDto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos[0]").value(photoUrl))
                .andExpect(jsonPath("$.photos.length()").value(1));
    }

    @Test
    @DisplayName("API: Фильтрация блюда по нескольким категориям")
    void shouldFilterByMultipleCategories() throws Exception {
        DishRequestDto d1 = new DishRequestDto(); d1.setName("Суп"); d1.setCategory(DishCategory.SOUP);
        DishRequestDto d2 = new DishRequestDto(); d2.setName("Десерт"); d2.setCategory(DishCategory.DESSERT);
        DishRequestDto d3 = new DishRequestDto(); d3.setName("Салат"); d3.setCategory(DishCategory.SALAD);
        
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(d1)));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(d2)));
        mockMvc.perform(multipart("/api/dishes").file(createDtoPart(d3)));

        mockMvc.perform(get("/api/dishes")
                .param("categories", "Суп", "Десерт")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("API: Возвращает пустой список при отсутствии совпадений")
    void shouldReturnEmptyListWhenFilterMatchesNothing() throws Exception {
        mockMvc.perform(get("/api/dishes")
                .param("search", "НесуществующееБлюдо12345")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("API: Удаление блюда с продуктами")
    void shouldDeleteDishAndNotAffectProducts() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Блюдо на удаление");
        DishIngredientRequestDto ing = new DishIngredientRequestDto();
        ing.setProductId(veganProduct.getId());
        ing.setAmount(100);
        dto.setIngredients(List.of(ing));

        String response = mockMvc.perform(multipart("/api/dishes").file(createDtoPart(dto)))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        String dishId = JsonPath.read(response, "$.id");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/dishes/{id}", dishId))
                .andExpect(status().isNoContent());

        assertTrue(productRepository.findById(veganProduct.getId()).isPresent());
    }

    @Test
    @DisplayName("API: Обновление несуществующего блюда")
    void shouldReturn404WhenUpdatingNonExistentDish() throws Exception {
        DishRequestDto dto = new DishRequestDto();
        dto.setName("Фантомное блюдо");

        mockMvc.perform(multipart("/api/dishes/{id}", "fake-id-123")
                .file(createDtoPart(dto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isNotFound());
    }
    
    private static Stream<Arguments> provideFilterArguments() {
        return Stream.of(
            Arguments.of("Полное совпадение", "Борщ", "Борщ"),
            Arguments.of("Частичное совпадение", "орщ", "Борщ"),
            Arguments.of("Игнорирование регистра", "бОрЩ", "Борщ")
        );
    }
    private MockMultipartFile createDtoPart(DishRequestDto dto) throws Exception {
        return new MockMultipartFile(
                "dto", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(dto)
        );
    }
}