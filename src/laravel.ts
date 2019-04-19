import fs from "fs";
import path from "path";
import {
    execSync
} from "child_process";
import {  
    workspace

} from "vscode";
import {
    
} from "./helpers";

class Laravel {
    public static kernelPath: string;
    
    constructor(corePath: string) {
        Laravel.kernelPath = corePath;
    }
    
    public static workspaceVerify() {
        const artisanPath = Laravel.workspacePath('artisan');
        if (artisanPath) {
            return fs.existsSync(artisanPath);
        }
        return false;
    }

    public static workspacePath(file: string = '/'): string | undefined {
        if (Array.isArray(workspace.workspaceFolders)) {
            const first = workspace.workspaceFolders[0];
            if (first) return path.join(first.uri.fsPath, file);
        }
    }

    public static runnerKernel(): string {
        const config = workspace.getConfiguration('php');
        const executablePath: string = config.get('validate.executablePath') || "php";

        const commands = `${executablePath} -d xdebug.remote_enable=0 -d xdebug.remote_autostart=0 -d xdebug.profiler_enable=0 "${Laravel.kernelPath}"`;
        return execSync(commands, {
            cwd : Laravel.workspacePath(),
            maxBuffer: Infinity,
        }).toString();
    }

    public static getKernel(): string {
        return `<?php

        /**
         * Laravel - A PHP Framework For Web Artisans
         *
         * @package  Laravel
         * @author   Taylor Otwell <taylor@laravel.com>
         */
        
        define('LARAVEL_START', microtime(true));
        
        /*
        |--------------------------------------------------------------------------
        | Register The Auto Loader
        |--------------------------------------------------------------------------
        |
        | Composer provides a convenient, automatically generated class loader for
        | our application. We just need to utilize it! We'll simply require it
        | into the script here so that we don't have to worry about manual
        | loading any of our classes later on. It feels great to relax.
        |
        */
        
        require '${Laravel.workspacePath()}/vendor/autoload.php';
        
        /*
        |--------------------------------------------------------------------------
        | Turn On The Lights
        |--------------------------------------------------------------------------
        |
        | We need to illuminate PHP development, so let us turn on the lights.
        | This bootstraps the framework and gets it ready for use, then it
        | will load up this application so that we can run it and send
        | the responses back to the browser and delight our users.
        |
        */
        
        $app = require_once '${Laravel.workspacePath()}/bootstrap/app.php';
        
        /*
        |--------------------------------------------------------------------------
        | Run The Application
        |--------------------------------------------------------------------------
        |
        | Once we have the application, we can handle the incoming request
        | through the kernel, and send the associated response back to
        | the client's browser allowing them to enjoy the creative
        | and wonderful application we have prepared for them.
        |
        */
        
        $kernel = $app->make(Illuminate\\Contracts\\Http\\Kernel::class);
        
        $response = $kernel->handle(
            $request = Illuminate\\Http\\Request::capture()
        );
        
        // Bridge
        $langs[''] = resource_path("lang");
        foreach (app('translator')->getLoader()->namespaces() as $key => $val) {
            $langs["\${key}::"] = $val;
        }

        $namespaces = [];
        foreach ($langs as $key => $val) {
            $files = glob($val . '/**/*.php');
            foreach ($files as $file) {
                $filename = pathinfo($file, PATHINFO_FILENAME);
                array_push($namespaces, $key.$filename);
            }
        }

        $translators = [];
        foreach (array_unique($namespaces) as $val) {
            $translators[$val] = __($val);
        }

        $routes = app('router')->getRoutes()->getRoutes();

        $actions = [];
        foreach ($routes as $key => $val) {
            $action = $val->getActionName();
            $split  = explode('@', $action);
            $method = null;
            if (count($split) == 2) {
                $method     = $split[1];
                $controller = $split[0];
            }else {
                $controller = $action;
            }
            if ($controller != 'Closure') {
                try {
                    $reflector = new \\ReflectionClass($controller);
                    $controllerPath = $reflector->getFileName();
                    array_push($actions, [
                        "full"      => $controller,
                        "base"      => $reflector->getShortName(),
                        "method"    => $method,
                        "script"    => $controllerPath,
                    ]);
                } catch (\\Throwable $th) { }
            }
        }

        $data = [
            'config' => config()->all(),
            'route'  => array_map(function ($route) {
                return [
                    'method'     => $route->methods(),
                    'uri'        => $route->uri(),
                    'name'       => $route->getName(),
                    'action'     => $route->getActionName(),
                    'parameters' => $route->parameterNames()
                ];
            }, $routes),
            'view'  => [
                'paths' => app('view')->getFinder()->getPaths(),
                'views' => app('view')->getFinder()->getHints(),
            ],
            'trans'   => $translators,
            'actions' => $actions,
        ];

        exit(json_encode($data));
        `;
    }
}

export = Laravel;