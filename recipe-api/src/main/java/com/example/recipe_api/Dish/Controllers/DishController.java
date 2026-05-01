package com.example.recipe_api.Dish.Controllers;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.recipe_api.Dish.Dtos.DishFilterDto;
import com.example.recipe_api.Dish.Dtos.DishReadDto;
import com.example.recipe_api.Dish.Dtos.DishRequestDto;
import com.example.recipe_api.Dish.Services.DishService;

import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import io.swagger.v3.oas.annotations.parameters.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
@CrossOrigin(origins = "*")
public class DishController {

    private final DishService dishService;

    public DishController(DishService dishService) {
        this.dishService = dishService;
    }

    @GetMapping
    public ResponseEntity<List<DishReadDto>> getFilteredDishes(@ParameterObject DishFilterDto filter) {
        return ResponseEntity.ok(dishService.getFilteredDishes(filter));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DishReadDto> getDish(@PathVariable String id) {
        try {
            return ResponseEntity.ok(dishService.getDishById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequestBody(content = @Content(
        encoding = @Encoding(name = "dto", contentType = "application/json")
    ))
    public ResponseEntity<DishReadDto> createDish(
            @RequestPart("dto") DishRequestDto dto,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        try {
            return ResponseEntity.ok(dishService.createDish(dto, files));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequestBody(content = @Content(
        encoding = @Encoding(name = "dto", contentType = "application/json")
    ))
    public ResponseEntity<DishReadDto> updateDish(
            @PathVariable String id,
            @RequestPart("dto") DishRequestDto dto,
            @RequestPart(value = "files", required = false) MultipartFile[] files) {
        try {
            return ResponseEntity.ok(dishService.updateDish(id, dto, files));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDish(@PathVariable String id) {
        dishService.deleteDish(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/product/{productId}")
    public List<DishReadDto> getDishesContainingProduct(@PathVariable String productId) {
        return dishService.getDishesContainingProduct(productId);
    }
}