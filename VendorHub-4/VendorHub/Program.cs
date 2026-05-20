using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using VendorHub.API.Data;
using VendorHub.API.Hubs;        
using VendorHub.API.Services.Implementations;
using VendorHub.API.Services.Interface;
using VendorHub.API.Services.Interfaces;
using VendorHub.API.Repositories;
using VendorHub.API.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));


//services
builder.Services.AddScoped<IProductsService, ProductsService>();
builder.Services.AddScoped<ICategoriesService, CategoriesService>();
builder.Services.AddScoped<IFavoritesService, FavoritesService>();
builder.Services.AddScoped<IReviewsService, ReviewsService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddSignalR();



// repoس
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173", "http://localhost:5175")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});


builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter: Bearer {your JWT token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// AUTOMATIC MIGRATION AND SEED LOGIC
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        Console.WriteLine("Database created successfully using SQLite.");

        var vendor = db.Users.FirstOrDefault(u => u.Role == "Vendor");
        if (vendor == null)
        {
            vendor = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Sample Vendor",
                Email = "vendor@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
                Role = "Vendor",
                IsApproved = true,
                IsActive = true,
                StoreName = "Sample Tech Store",
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(vendor);
            Console.WriteLine("SEED: Created sample vendor.");
        }

        var admin = db.Users.FirstOrDefault(u => u.Role == "Admin");
        if (admin == null)
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                FullName = "Super Admin",
                Email = "admin@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                Role = "Admin",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(admin);
            Console.WriteLine("SEED: Created sample admin.");
        }

        var customer = db.Users.FirstOrDefault(u => u.Role == "Customer");
        if (customer == null)
        {
            customer = new User
            {
                Id = Guid.NewGuid(),
                FullName = "John Customer",
                Email = "customer@example.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("customer123"),
                Role = "Customer",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            db.Users.Add(customer);
            Console.WriteLine("SEED: Created sample customer.");
        }

        db.SaveChanges();

        var category = db.Categories.FirstOrDefault();
        if (category == null)
        {
            category = new Category { Name = "Electronics" };
            db.Categories.Add(category);
            db.SaveChanges();
            Console.WriteLine("SEED: Created Electronics category.");
        }

        if (!db.Products.Any(p => p.Title == "Ultra Gaming Mouse"))
        {
            var product1 = new Product { Id = Guid.NewGuid(), Title = "Ultra Gaming Mouse", Description = "Pro gaming mouse", Price = 89.99m, Stock = 100, CategoryId = category.Id, VendorId = vendor.Id, Status = "Approved", CreatedAt = DateTime.UtcNow };
            var product2 = new Product { Id = Guid.NewGuid(), Title = "Mechanical Keyboard", Description = "RGB Keyboard", Price = 129.50m, Stock = 50, CategoryId = category.Id, VendorId = vendor.Id, Status = "Approved", CreatedAt = DateTime.UtcNow };
            
            db.Products.Add(product1);
            db.Products.Add(product2);

            // Add images
            db.ProductImages.Add(new ProductImage { Id = Guid.NewGuid(), ProductId = product1.Id, ImageUrl = "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&auto=format&fit=crop&q=60", DisplayOrder = 0 });
            db.ProductImages.Add(new ProductImage { Id = Guid.NewGuid(), ProductId = product2.Id, ImageUrl = "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500&auto=format&fit=crop&q=60", DisplayOrder = 0 });

            db.SaveChanges();
            Console.WriteLine("SEED: Added sample products with images.");
        }
        // SEED NOTIFICATIONS
        var users = db.Users.ToList();
        foreach (var u in users)
        {
            if (!db.Notifications.Any(n => n.UserId == u.Id))
            {
                db.Notifications.Add(new Notification
                {
                    Id = Guid.NewGuid(),
                    UserId = u.Id,
                    Title = "Welcome to VendorHub",
                    Message = $"Hello {u.FullName}, welcome to our platform! Start exploring now.",
                    Type = "Welcome",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                });
                Console.WriteLine($"SEED: Created welcome notification for {u.Email}");
            }
        }
        db.SaveChanges();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"An error occurred during migration or seeding: {ex.Message}");
    }
}


app.UseCors("ReactPolicy");


//if (app.Environment.IsDevelopment())
//{
    app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");
app.Run();