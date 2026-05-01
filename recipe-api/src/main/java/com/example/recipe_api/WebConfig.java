package com.example.recipe_api;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.example.recipe_api.Core.Enums.Flag;
import com.example.recipe_api.Dish.Enums.DishCategory;
import com.example.recipe_api.Product.Enums.ProductCategory;
import com.example.recipe_api.Product.Enums.Readiness;

import org.springframework.core.convert.converter.Converter;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addFormatters(FormatterRegistry registry) {
        registry.addConverter(new Converter<String, DishCategory>() {
            @Override
            public DishCategory convert(String source) {
                return DishCategory.fromString(source);
            }
        });

        registry.addConverter(new Converter<String, Flag>() {
            @Override
            public Flag convert(String source) {
                return Flag.fromString(source);
            }
        });

        registry.addConverter(new Converter<String, ProductCategory>() {
            @Override
            public ProductCategory convert(String source) {
                return ProductCategory.fromValue(source);
            }
        });

        registry.addConverter(new Converter<String, Readiness>() {
            @Override
            public Readiness convert(String source) {
                return Readiness.fromString(source);
            }
        });
    }

    @Value("${app.upload-dir:uploads}") 
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir);
        String uploadAbsolutePath = uploadPath.toFile().getAbsolutePath();
        registry.addResourceHandler("/api/files/**")
                .addResourceLocations("file:" + uploadAbsolutePath + "/");
    }

}
