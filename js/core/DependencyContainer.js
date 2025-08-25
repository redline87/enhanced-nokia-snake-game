// Dependency Injection Container
// King/Blizzard standard: Loose coupling through dependency injection

class DependencyContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
        this.factories = new Map();
        this.interfaces = new Map();
        this.middleware = [];
    }
    
    // Register a service with its dependencies
    register(name, constructor, dependencies = [], options = {}) {
        if (typeof name !== 'string') {
            throw new Error('Service name must be a string');
        }
        
        if (typeof constructor !== 'function') {
            throw new Error('Service constructor must be a function');
        }
        
        this.services.set(name, {
            constructor,
            dependencies,
            singleton: options.singleton !== false, // Default to singleton
            lazy: options.lazy === true,
            interface: options.interface,
            factory: options.factory === true
        });
        
        // If interface is specified, register the mapping
        if (options.interface) {
            this.interfaces.set(options.interface, name);
        }
        
        return this;
    }
    
    // Register a factory function
    registerFactory(name, factory, dependencies = []) {
        this.factories.set(name, { factory, dependencies });
        return this;
    }
    
    // Register a singleton instance
    registerInstance(name, instance) {
        this.singletons.set(name, instance);
        return this;
    }
    
    // Resolve a service by name or interface
    resolve(name) {
        // Check if it's an interface
        if (this.interfaces.has(name)) {
            name = this.interfaces.get(name);
        }
        
        // Check singletons first
        if (this.singletons.has(name)) {
            return this.singletons.get(name);
        }
        
        // Check factories
        if (this.factories.has(name)) {
            return this.resolveFactory(name);
        }
        
        // Resolve service
        if (this.services.has(name)) {
            return this.resolveService(name);
        }
        
        throw new Error(`Service '${name}' not found in container`);
    }
    
    resolveService(name) {
        const service = this.services.get(name);
        
        if (!service) {
            throw new Error(`Service '${name}' not registered`);
        }
        
        // Check if we already have a singleton instance
        if (service.singleton && this.singletons.has(name)) {
            return this.singletons.get(name);
        }
        
        // Resolve dependencies
        const resolvedDependencies = service.dependencies.map(dep => {
            try {
                return this.resolve(dep);
            } catch (error) {
                throw new Error(`Failed to resolve dependency '${dep}' for service '${name}': ${error.message}`);
            }
        });
        
        // Create instance
        let instance;
        try {
            instance = new service.constructor(...resolvedDependencies);
        } catch (error) {
            throw new Error(`Failed to create instance of '${name}': ${error.message}`);
        }
        
        // Apply middleware
        instance = this.applyMiddleware(instance, name);
        
        // Store singleton if needed
        if (service.singleton) {
            this.singletons.set(name, instance);
        }
        
        return instance;
    }
    
    resolveFactory(name) {
        const factory = this.factories.get(name);
        const resolvedDependencies = factory.dependencies.map(dep => this.resolve(dep));
        return factory.factory(...resolvedDependencies);
    }
    
    // Add middleware for cross-cutting concerns
    addMiddleware(middleware) {
        if (typeof middleware !== 'function') {
            throw new Error('Middleware must be a function');
        }
        this.middleware.push(middleware);
        return this;
    }
    
    applyMiddleware(instance, serviceName) {
        return this.middleware.reduce((inst, middleware) => {
            return middleware(inst, serviceName, this) || inst;
        }, instance);
    }
    
    // Check if service exists
    has(name) {
        return this.services.has(name) || 
               this.singletons.has(name) || 
               this.factories.has(name) ||
               this.interfaces.has(name);
    }
    
    // Get all registered service names
    getRegisteredServices() {
        return {
            services: Array.from(this.services.keys()),
            singletons: Array.from(this.singletons.keys()),
            factories: Array.from(this.factories.keys()),
            interfaces: Array.from(this.interfaces.keys())
        };
    }
    
    // Create child container with parent fallback
    createChild() {
        const child = new DependencyContainer();
        child.parent = this;
        
        // Override resolve to check parent if not found
        const originalResolve = child.resolve.bind(child);
        child.resolve = (name) => {
            try {
                return originalResolve(name);
            } catch (error) {
                if (child.parent) {
                    return child.parent.resolve(name);
                }
                throw error;
            }
        };
        
        return child;
    }
    
    // Dispose of container and cleanup
    dispose() {
        // Call dispose on all singletons that support it
        for (const [name, instance] of this.singletons) {
            if (instance && typeof instance.dispose === 'function') {
                try {
                    instance.dispose();
                } catch (error) {
                    console.warn(`Error disposing service '${name}':`, error);
                }
            }
        }
        
        this.services.clear();
        this.singletons.clear();
        this.factories.clear();
        this.interfaces.clear();
        this.middleware = [];
    }
}

// Middleware for logging service creation (development)
const LoggingMiddleware = (instance, serviceName, container) => {
    if ((typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || window.location.hostname === 'localhost') {
        console.log(`🏭 Service '${serviceName}' created`);
    }
    return instance;
};

// Middleware for error handling
const ErrorHandlingMiddleware = (instance, serviceName, container) => {
    if (!instance || typeof instance !== 'object') {
        return instance;
    }
    
    // Wrap methods with error handling
    const proto = Object.getPrototypeOf(instance);
    const methodNames = Object.getOwnPropertyNames(proto)
        .filter(name => typeof instance[name] === 'function' && name !== 'constructor');
    
    methodNames.forEach(methodName => {
        const originalMethod = instance[methodName];
        instance[methodName] = function(...args) {
            try {
                const result = originalMethod.apply(this, args);
                
                // Handle async methods
                if (result && typeof result.catch === 'function') {
                    return result.catch(error => {
                        console.error(`Error in ${serviceName}.${methodName}():`, error);
                        
                        // Track errors if analytics is available
                        if (container.has('IAnalyticsService')) {
                            try {
                                const analytics = container.resolve('IAnalyticsService');
                                analytics.trackEvent('service_error', {
                                    service: serviceName,
                                    method: methodName,
                                    error: error.message
                                });
                            } catch (e) {
                                // Ignore analytics errors
                            }
                        }
                        
                        throw error;
                    });
                }
                
                return result;
                
            } catch (error) {
                console.error(`Error in ${serviceName}.${methodName}():`, error);
                
                // Track errors if analytics is available
                if (container.has('IAnalyticsService')) {
                    try {
                        const analytics = container.resolve('IAnalyticsService');
                        analytics.trackEvent('service_error', {
                            service: serviceName,
                            method: methodName,
                            error: error.message
                        });
                    } catch (e) {
                        // Ignore analytics errors
                    }
                }
                
                throw error;
            }
        };
    });
    
    return instance;
};

// Middleware for performance monitoring
const PerformanceMiddleware = (instance, serviceName, container) => {
    if (!instance || typeof instance !== 'object') {
        return instance;
    }
    
    // Only wrap performance-critical services
    const performanceCriticalServices = [
        'GameEngine', 'BattlePassManager', 'ClanManager', 'AnalyticsManager'
    ];
    
    if (!performanceCriticalServices.includes(serviceName)) {
        return instance;
    }
    
    const proto = Object.getPrototypeOf(instance);
    const methodNames = Object.getOwnPropertyNames(proto)
        .filter(name => typeof instance[name] === 'function' && name !== 'constructor');
    
    methodNames.forEach(methodName => {
        const originalMethod = instance[methodName];
        instance[methodName] = function(...args) {
            const start = performance.now();
            const result = originalMethod.apply(this, args);
            
            // Handle async methods
            if (result && typeof result.then === 'function') {
                return result.then(value => {
                    const duration = performance.now() - start;
                    if (duration > 100) { // Log slow operations
                        console.warn(`⚡ Slow operation: ${serviceName}.${methodName}() took ${duration.toFixed(2)}ms`);
                    }
                    return value;
                });
            }
            
            const duration = performance.now() - start;
            if (duration > 50) { // Log slow operations
                console.warn(`⚡ Slow operation: ${serviceName}.${methodName}() took ${duration.toFixed(2)}ms`);
            }
            
            return result;
        };
    });
    
    return instance;
};

// Create global container instance
const container = new DependencyContainer();

// Add standard middleware
container.addMiddleware(LoggingMiddleware);
container.addMiddleware(ErrorHandlingMiddleware);
container.addMiddleware(PerformanceMiddleware);

// Export container and class
window.DependencyContainer = DependencyContainer;
window.DIContainer = container;

// export { DependencyContainer, container as DIContainer }; // Commented out - using global assignment instead