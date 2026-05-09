package com.example.recipe_api;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Stream;

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
import com.example.recipe_api.Product.Entities.Product;
import com.example.recipe_api.Product.Repositories.ProductRepository;
import com.jayway.jsonpath.DocumentContext;
import com.jayway.jsonpath.JsonPath;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RecipeBookApplicationTests {

	@Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    private Product veganProduct;
    private Product meatProduct;


	@BeforeEach
    void setUp() {
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

        productRepository.saveAll(List.of(veganProduct, meatProduct));
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
    @CsvSource({
            "0, 0.0",
            "1, 1.65",
            "200, 330.0"
    })
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
