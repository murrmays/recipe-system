package com.example.recipe_api.Dish.Services;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Core.Helpers.DishMapper;
import com.example.recipe_api.Core.Services.FileStorageService;
import com.example.recipe_api.Dish.Dtos.DishFilterDto;
import com.example.recipe_api.Dish.Dtos.DishIngredientRequestDto;
import com.example.recipe_api.Dish.Dtos.DishReadDto;
import com.example.recipe_api.Dish.Dtos.DishRequestDto;
import com.example.recipe_api.Dish.Entities.Dish;
import com.example.recipe_api.Dish.Entities.DishIngredient;
import com.example.recipe_api.Dish.Enums.DishCategory;
import com.example.recipe_api.Dish.Repositories.DishRepository;
import com.example.recipe_api.Dish.Repositories.DishSpecs;
import com.example.recipe_api.Product.Entities.Product;
import com.example.recipe_api.Product.Repositories.ProductRepository;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DishService {

    private final DishRepository dishRepository;
    private final ProductRepository productRepository;
    private final DishMapper dishMapper;
    private final FileStorageService fileStorageService;

    @Transactional
    public DishReadDto createDish(DishRequestDto dto, MultipartFile[] files) {
        Dish dish = dishMapper.toEntity(dto);

        processDishBusinessLogic(dish, dto);
        dish.setCreationDate(LocalDateTime.now());
        dish.setPhotos(processPhotos(dto.getPhotos(), files));

        return dishMapper.toReadDto(dishRepository.save(dish));
    }

    @Transactional
    public DishReadDto updateDish(String id, DishRequestDto dto, MultipartFile[] files) {
        Dish existingDish = dishRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Блюдо не найдено"));

        dishMapper.updateEntityFromDto(dto, existingDish);

        processDishBusinessLogic(existingDish, dto);
        existingDish.setPhotos(processPhotos(dto.getPhotos(), files));
        existingDish.setEditDate(LocalDateTime.now());

        return dishMapper.toReadDto(dishRepository.save(existingDish));
    }

    @Transactional(readOnly = true)
    public List<DishReadDto> getFilteredDishes(DishFilterDto filter) {
        return dishRepository.findAll(DishSpecs.withFilters(filter)).stream()
                .map(dishMapper::toReadDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DishReadDto getDishById(String id) {
        return dishRepository.findById(id)
                .map(dishMapper::toReadDto)
                .orElseThrow(() -> new RuntimeException("Блюдо не найдено"));
    }

    @Transactional
    public void deleteDish(String id) {
        dishRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<DishReadDto> getDishesContainingProduct(String productId) {
        return dishRepository.findByProductIdInIngredients(productId).stream()
                .map(dishMapper::toReadDto)
                .collect(Collectors.toList());
    }

    private void processDishBusinessLogic(Dish dish, DishRequestDto dto) {
        List<DishIngredient> ingredients = buildIngredients(dto.getIngredients());
        dish.setIngredients(ingredients);

        ParsedName parsed = parseNameAndCategory(dto.getName());
        dish.setName(parsed.cleanName());
        dish.setCategory(dto.getCategory() != null ? dto.getCategory() : parsed.category());

        Set<Flag> allowedFlags = calculateAllowedFlags(ingredients);
        dish.setFlags(new ArrayList<>(allowedFlags));
        calculateMacros(dish, ingredients, dto);
    }

    private List<DishIngredient> buildIngredients(List<DishIngredientRequestDto> dtos) {
        if (dtos == null || dtos.isEmpty()) return new ArrayList<>();

        return dtos.stream().map(req -> {
            Product product = productRepository.findById(req.getProductId())
                    .orElseThrow(() -> new RuntimeException("Продукт не найден: " + req.getProductId()));

            DishIngredient ingredient = new DishIngredient();
            ingredient.setProduct(product);
            ingredient.setAmount(req.getAmount());
            return ingredient;
        }).collect(Collectors.toList());
    }

    private record ParsedName(String cleanName, DishCategory category) {}

    private ParsedName parseNameAndCategory(String rawName) {
        if (rawName == null) return new ParsedName("", null);
        DishCategory firstCategory = null;
        int earliestIndex = Integer.MAX_VALUE;

        for (DishCategory cat : DishCategory.values()) {
            if (cat.getMacro() != null && !cat.getMacro().isEmpty()) {
                int index = rawName.indexOf(cat.getMacro());
                if (index != -1 && index < earliestIndex) {
                    earliestIndex = index;
                    firstCategory = cat;
                }
            }
        }
        if (firstCategory == null) {
            return new ParsedName(rawName.replaceAll("\\s+", " ").trim(), null);
        }

        String cleanName = rawName;
        for (DishCategory cat : DishCategory.values()) {
            if (cat != firstCategory && cat.getMacro() != null && !cat.getMacro().isEmpty()) {
                cleanName = cleanName.replace(cat.getMacro(), "");
            }
        }
        cleanName = cleanName.replace(firstCategory.getMacro(), "");
        cleanName = cleanName.replaceAll("\\s+", " ").trim();
        return new ParsedName(cleanName, firstCategory);
    }


    private Set<Flag> calculateAllowedFlags(List<DishIngredient> ingredients) {
        if (ingredients == null || ingredients.isEmpty()) {
            return EnumSet.noneOf(Flag.class);
        }
        Set<Flag> commonFlags = EnumSet.allOf(Flag.class);

        for (DishIngredient ing : ingredients) {
            Product p = ing.getProduct();
            if (p.getFlags() == null || p.getFlags().isEmpty()) {
                return EnumSet.noneOf(Flag.class);
            }
            commonFlags.retainAll(p.getFlags());
        }

        return commonFlags;
    }

    private void calculateMacros(Dish dish, List<DishIngredient> ingredients, DishRequestDto dto) {
        double calcCalories = 0, calcProteins = 0, calcFats = 0, calcCarbs = 0;

        for (DishIngredient ing : ingredients) {
            Product p = ing.getProduct();
            double multiplier = ing.getAmount() / 100.0;
            calcCalories += p.getCalories() * multiplier;
            calcProteins += p.getProteins() * multiplier;
            calcFats += p.getFats() * multiplier;
            calcCarbs += p.getCarbs() * multiplier;
        }

        dish.setCalories(dto.getCalories() != null ? dto.getCalories() : calcCalories);
        dish.setProteins(dto.getProteins() != null ? dto.getProteins() : calcProteins);
        dish.setFats(dto.getFats() != null ? dto.getFats() : calcFats);
        dish.setCarbs(dto.getCarbs() != null ? dto.getCarbs() : calcCarbs);
    }
    

    private List<String> processPhotos(List<String> existingPhotos, MultipartFile[] newFiles) {
        List<String> finalPhotos = new ArrayList<>();

        if (existingPhotos != null) {
            finalPhotos.addAll(existingPhotos);
        }
        if (newFiles != null) {
            for (MultipartFile file : newFiles) {
                if (!file.isEmpty()) {
                    finalPhotos.add(fileStorageService.storeFile(file));
                }
            }
        }
        if (finalPhotos.size() > 5) {
            throw new IllegalArgumentException("Максимальное количество фотографий - 5");
        }
        return finalPhotos;
    }
}