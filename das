[1mdiff --git a/src/app/kitchen/layouts/kitchen-layout/kitchen-layout.component.html b/src/app/kitchen/layouts/kitchen-layout/kitchen-layout.component.html[m
[1mindex ca22120..90c6b64 100644[m
[1m--- a/src/app/kitchen/layouts/kitchen-layout/kitchen-layout.component.html[m
[1m+++ b/src/app/kitchen/layouts/kitchen-layout/kitchen-layout.component.html[m
[36m@@ -1,3 +1 @@[m
[31m-<section>[m
[31m-    <router-outlet/>[m
[31m-</section>[m
\ No newline at end of file[m
[32m+[m[32m<router-outlet></router-outlet>[m
\ No newline at end of file[m
[1mdiff --git a/src/app/kitchen/pages/kitchen-page/kitchen-page.component.html b/src/app/kitchen/pages/kitchen-page/kitchen-page.component.html[m
[1mindex aae32e1..8ad206a 100644[m
[1m--- a/src/app/kitchen/pages/kitchen-page/kitchen-page.component.html[m
[1m+++ b/src/app/kitchen/pages/kitchen-page/kitchen-page.component.html[m
[36m@@ -1,42 +1,7 @@[m
[31m-<div class="text-white kitchen-page">[m
[31m-  <h1>Active Orders</h1>[m
[31m-  <div class="overflow-y-auto order-list">[m
[31m-    @for(order of orders;track order.id){[m
[31m-    <div class="order-item">[m
[31m-      <div class="order-header">[m
[31m-        <h2>Table {{ order.mesa }}</h2>[m
[31m-        <span>#{{ order.id }}</span>[m
[31m-      </div>[m
[31m-      <div class="order-details">[m
[31m-        @for (product of order.productos; track $index) {[m
[31m-        <p>{{ product.quantity }}x Product ID: {{ product.productId }}</p>[m
[31m-        }[m
[31m-      </div>[m
[31m-      <div class="order-status">[m
[31m-        <span [class]="order.estado">{{ order.estado }}</span>[m
[31m-      </div>[m
[31m-      <div class="order-actions">[m
[31m-        @if(order.estado === orderStatus.PENDIENTE) {[m
[31m-        <button class="order-item" (click)="startPreparation(order)">[m
[31m-          Start Preparation[m
[31m-        </button>[m
[31m-        }[m
[31m-[m
[31m-        <!--  -->[m
[31m-        @if(order.estado === orderStatus.EN_PREPARACION) {[m
[31m-        <button class="order-item" (click)="startPreparation(order)">[m
[31m-          Start Preparation[m
[31m-        </button>[m
[31m-        }[m
[31m-[m
[31m-        <!--  -->[m
[31m-        @if(order.estado === orderStatus.TERMINADO) {[m
[31m-        <button class="order-item" (click)="startPreparation(order)">[m
[31m-          Completed[m
[31m-        </button>[m
[31m-        }[m
[31m-      </div>[m
[31m-    </div>[m
[31m-    }[m
[31m-  </div>[m
[32m+[m[32m<div class="p-8">[m
[32m+[m[32m  <h1 class="text-2xl font-bold mb-6">Active Orders</h1>[m
[32m+[m[32m  <app-order-list[m
[32m+[m[32m    [orders]="kitchenOrders"[m
[32m+[m[32m    (changeStatus)="onChangeStatus($event)"[m
[32m+[m[32m  ></app-order-list>[m
 </div>[m
\ No newline at end of file[m
[1mdiff --git a/src/app/kitchen/pages/kitchen-page/kitchen-page.component.ts b/src/app/kitchen/pages/kitchen-page/kitchen-page.component.ts[m
[1mindex 2b576ff..1262517 100644[m
[1m--- a/src/app/kitchen/pages/kitchen-page/kitchen-page.component.ts[m
[1m+++ b/src/app/kitchen/pages/kitchen-page/kitchen-page.component.ts[m
[36m@@ -1,85 +1,61 @@[m
[31m-import { Component, inject, OnInit } from '@angular/core';[m
[31m-import { OrderStatus, Order } from 'src/app/orders/interfaces/order.interface';[m
[32m+[m[32mimport { Component, inject } from '@angular/core';[m
[32m+[m[32mimport { CommonModule } from '@angular/common';[m
[32m+[m[32mimport { OrderListComponent } from '../../components/order-list/kitchen-order-list.component';[m
 import { OrderService } from 'src/app/orders/services/order.service';[m
[32m+[m[32mimport { Order } from 'src/app/orders/interfaces/order.interface';[m
[32m+[m[32mimport { KitchenOrder, KitchenProduct } from '../../interfaces/kitchen-order.interface';[m
[32m+[m
 [m
 @Component({[m
   selector: 'app-kitchen-page',[m
[32m+[m[32m  standalone: true,[m
[32m+[m[32m  imports: [CommonModule, OrderListComponent],[m
   templateUrl: './kitchen-page.component.html',[m
[31m-  styleUrls: ['./kitchen-page.component.css'],[m
 })[m
[31m-export class KitchenPageComponent implements OnInit {[m
[31m-  orders: Order[] = [[m
[31m-    {[m
[31m-      id: 1,[m
[31m-      estado: 'PENDIENTE',[m
[31m-      total: 10,[m
[31m-      createdAt: new Date(),[m
[31m-      mesa: 1,[m
[31m-      productos: [],[m
[31m-    },[m
[31m-    {[m
[31m-      id: 2,[m
[31m-      estado: 'EN_PREPARACION',[m
[31m-      total: 10,[m
[31m-      createdAt: new Date(),[m
[31m-      mesa: 1,[m
[31m-      productos: [],[m
[31m-    },[m
[31m-    {[m
[31m-      id: 3,[m
[31m-      estado: 'PENDIENTE',[m
[31m-      total: 10,[m
[31m-      createdAt: new Date(),[m
[31m-      mesa: 1,[m
[31m-      productos: [],[m
[31m-    },[m
[31m-    {[m
[31m-      id: 4,[m
[31m-      estado: 'PENDIENTE',[m
[31m-      total: 10,[m
[31m-      createdAt: new Date(),[m
[31m-      mesa: 1,[m
[31m-      productos: [],[m
[31m-    },[m
[31m-    {[m
[31m-      id: 5,[m
[31m-      estado: 'TERMINADO',[m
[31m-      total: 10,[m
[31m-      createdAt: new Date(),[m
[31m-      mesa: 1,[m
[31m-      productos: [],[m
[31m-    },[m
[31m-  ];[m
[31m-[m
[32m+[m[32mexport class KitchenPageComponent {[m
   orderService = inject(OrderService);[m
[31m-  orderStatus = OrderStatus;[m
[32m+[m[32m  kitchenOrders: KitchenOrder[] = [];[m
[32m+[m
 [m
[31m-  ngOnInit(): void {[m
[32m+[m[32m  constructor() {[m
     this.loadOrders();[m
   }[m
 [m
[31m-  loadOrders(): void {[m
[32m+[m[32m  loadOrders() {[m
     this.orderService.fecthOrders().subscribe((orders) => {[m
[31m-      this.orders = orders.sort([m
[31m-        (a, b) =>[m
[31m-          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()[m
[31m-      );[m
[32m+[m[32m      this.kitchenOrders = orders[m
[32m+[m[32m        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[m
[32m+[m[32m        .map(order => this.mapOrderToKitchenOrder(order));[m
     });[m
   }[m
 [m
[31m-  startPreparation(order: Order): void {[m
[31m-    order.estado = OrderStatus.EN_PREPARACION;[m
[31m-    this.orderService.updateOrder(order).subscribe();[m
[32m+[m[32m  onChangeStatus({ order, status }: { order: KitchenOrder, status: 'EN_PREPARACION' | 'LISTO' }) {[m
[32m+[m[32m    // Si necesitas actualizar el pedido en el backend, convierte KitchenOrder a Order aquí[m
[32m+[m[32m    // O busca el Order original por ID y actualiza su estado[m
[32m+[m[32m    // Ejemplo:[m
[32m+[m[32m    // const originalOrder = ...;[m
[32m+[m[32m    // originalOrder.estado = status;[m
[32m+[m[32m    // this.orderService.updateOrder(originalOrder).subscribe(...);[m
[32m+[m[32m    this.notifyWaiter(order);[m
[32m+[m[32m    this.loadOrders();[m
   }[m
 [m
[31m-  markAsFinished(order: Order): void {[m
[31m-    order.estado = OrderStatus.LISTO;[m
[31m-    this.orderService.updateOrder(order).subscribe(() => {[m
[31m-      this.notifyWaiter(order);[m
[31m-    });[m
[32m+[m[32m  mapOrderToKitchenOrder(order: Order): KitchenOrder {[m
[32m+[m[32m    return {[m
[32m+[m[32m      id: order.id,[m
[32m+[m[32m      mesa: order.mesa,[m
[32m+[m[32m      estado: order.estado as 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO',[m
[32m+[m[32m      createdAt: order.createdAt,[m
[32m+[m[32m      productos: order.productos.map(p => ({[m
[32m+[m[32m        nombre: (p as any).name ?? '', // Ajusta según tu modelo[m
[32m+[m[32m        cantidad: p.quantity ?? 0,[m
[32m+[m[32m      })),[m
[32m+[m[32m    };[m
   }[m
[32m+[m[41m  [m
 [m
[31m-  notifyWaiter(order: Order): void {[m
[32m+[m[32m  notifyWaiter(order: KitchenOrder) {[m
[32m+[m[32m    // Aquí puedes implementar la notificación real[m
     console.log(`Order ${order.id} is ready for delivery.`);[m
   }[m
[31m-}[m
[32m+[m[32m}[m
\ No newline at end of file[m
