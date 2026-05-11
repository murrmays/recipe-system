package com.example.recipe_api;

import java.nio.charset.StandardCharsets;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Repositories.DishRepository;
import com.example.recipe_api.Product.Dtos.ProductRequestDto;
import com.example.recipe_api.Product.Entities.Product;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;
import com.example.recipe_api.Product.Repositories.ProductRepository;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProductTests {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private DishRepository dishRepository;

    private Product apple;
    private Product beef;

    @BeforeEach
    void setUp() {
        dishRepository.deleteAll();
        productRepository.deleteAll();

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

        productRepository.saveAll(List.of(apple, beef));
    }

    @Test
    @DisplayName("API: Успешное создание блюда")
    void shouldCreateValidProduct() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Томат");
        dto.setCalories(18.0);
        dto.setProteins(0.9);
        dto.setFats(0.2);
        dto.setCarbs(3.9);
        dto.setCategory(ProductCategory.VEGETABLES);
        dto.setReadiness(Readiness.READY);
        dto.setFlags(List.of(Flag.VEGAN));

        MvcResult result = mockMvc.perform(multipart("/api/products").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andReturn();

        DocumentContext json = JsonPath.parse(result.getResponse().getContentAsString(StandardCharsets.UTF_8));

        assertAll(
                () -> assertNotNull(json.read("$.id")),
                () -> assertEquals("Томат", json.read("$.name")),
                () -> assertEquals(18.0, (Double) json.read("$.calories"))
        );
    }

    @Test
    @DisplayName("API: Успешное создание блюда с нулевым КБЖУ")
    void shouldCreateProductWithMinimalFields() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Вода");

        mockMvc.perform(multipart("/api/products").file(createDtoPart(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Вода"))
                .andExpect(jsonPath("$.calories").value(0.0))
                .andExpect(jsonPath("$.flags").isEmpty());
    }

    @Test
    @DisplayName("API: Загрузка ровно пяти фото")
    void shouldUploadExactlyFivePhotos() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Продукт 5 фото");

        var requestBuilder = multipart("/api/products").file(createDtoPart(dto));
        for (int i = 0; i < 5; i++) {
            requestBuilder.file(new MockMultipartFile("files", "img" + i + ".jpg", MediaType.IMAGE_JPEG_VALUE, "data".getBytes()));
        }

        mockMvc.perform(requestBuilder)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos.length()").value(5));
    }

    @Test
    @DisplayName("API: Загрузка не более пяти фото")
    void shouldRejectMoreThanFivePhotos() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Продукт 6 фото");

        var requestBuilder = multipart("/api/products").file(createDtoPart(dto));
        for (int i = 0; i < 6; i++) {
            requestBuilder.file(new MockMultipartFile("files", "img" + i + ".jpg", MediaType.IMAGE_JPEG_VALUE, "data".getBytes()));
        }

        mockMvc.perform(requestBuilder)
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("API: Успешное получение продукта по ID")
    void shouldGetProductById() throws Exception {
        mockMvc.perform(get("/api/products/{id}", apple.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Яблоко зеленое"));
    }

    @Test
    @DisplayName("API: Ошибка при поиске несуществующего продукта")
    void shouldReturn404ForNonExistentProduct() throws Exception {
        mockMvc.perform(get("/api/products/{id}", "fake-uuid-123"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("API: Успешное обновление продукта")
    void shouldUpdateProductSuccessfully() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Яблоко красное");
        dto.setCalories(60.0);

        mockMvc.perform(multipart("/api/products/{id}", apple.getId())
                .file(createDtoPart(dto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Яблоко красное"))
                .andExpect(jsonPath("$.calories").value(60.0));
    }

    @Test
    @DisplayName("API: Сохранение фото при обновлении")
    void shouldKeepExistingProductPhotosOnUpdate() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Яблоко");
        dto.setPhotos(List.of("/api/files/old.jpg"));

        MockMultipartFile newPhoto = new MockMultipartFile("files", "new.jpg", MediaType.IMAGE_JPEG_VALUE, "data".getBytes());

        mockMvc.perform(multipart("/api/products/{id}", apple.getId())
                .file(createDtoPart(dto))
                .file(newPhoto)
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos.length()").value(2))
                .andExpect(jsonPath("$.photos[0]").value("/api/files/old.jpg"));
    }

    @Test
    @DisplayName("API: Ошибка при обновлении несуществующего продукта")
    void shouldReturn404WhenUpdatingNonExistentProduct() throws Exception {
        ProductRequestDto dto = new ProductRequestDto();
        dto.setName("Фантом");

        mockMvc.perform(multipart("/api/products/{id}", "fake-uuid")
                .file(createDtoPart(dto))
                .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("API: Успешное удаление")
    void shouldDeleteProductSuccessfully() throws Exception {
        mockMvc.perform(delete("/api/products/{id}", beef.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products/{id}", beef.getId()))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @CsvSource({
            "Яблоко, Яблоко зеленое",
            "яблоко, Яблоко зеленое",
            "ЗЕЛЕНОЕ, Яблоко зеленое"
    })
    void shouldFilterByNameCaseInsensitive(String searchParam, String expectedName) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products")
                .param("search", searchParam))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        List<String> names = JsonPath.read(json, "$[*].name");
        assertTrue(names.contains(expectedName));
    }

    @Test
    @DisplayName("API: Фильтрация по категории")
    void shouldFilterByCategory() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("categories", "Мясной"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Говядина"));
    }

    @Test
    @DisplayName("API: Фильтрация по нескольким категориям")
    void shouldFilterProductsByMultipleCategories() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("categories", "Мясной", "Замороженный"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("API: Фильтрация по степени готовности")
    void shouldFilterByReadiness() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("readiness", "Требует приготовления"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Говядина"));
    }

    @Test
    @DisplayName("API: Фильтрация по нескольким флагам")
    void shouldFilterByMultipleFlags() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("flags", "Веган", "Без глютена"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Яблоко зеленое"));
    }

    @Test
    @DisplayName("API: Возвращает пустой список при отсутствии совпадений")
    void shouldReturnEmptyProductListWhenFilterMatchesNothing() throws Exception {
        mockMvc.perform(get("/api/products")
                .param("search", "Абракадабра123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("API: Сортировка по калорийности")
    void shouldSortByCaloriesAscending() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products")
                .param("sort", "caloriesAsc"))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        Double firstCal = JsonPath.read(json, "$[0].calories");
        Double secondCal = JsonPath.read(json, "$[1].calories");
        
        assertTrue(firstCal <= secondCal);
    }

    @Test
    @DisplayName("API: Сортировка по имени")
    void shouldSortByNameDescending() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/products")
                .param("sort", "nameDesc"))
                .andExpect(status().isOk())
                .andReturn();

        String json = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        String firstName = JsonPath.read(json, "$[0].name");
        String secondName = JsonPath.read(json, "$[1].name");

        assertTrue(firstName.compareTo(secondName) >= 0);
    }

    private MockMultipartFile createDtoPart(ProductRequestDto dto) throws Exception {
        return new MockMultipartFile(
                "dto", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(dto)
        );
    }
}
