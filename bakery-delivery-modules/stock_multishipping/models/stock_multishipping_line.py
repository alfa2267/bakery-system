# -*- coding: utf-8 -*-

from odoo import api, fields, models, SUPERUSER_ID, _
from odoo.exceptions import ValidationError


class StockMultishippingLine(models.Model):
    _name = 'stock.multishipping.line'

    name = fields.Char(string="Name", compute='_compute_name')
    x_multishipping_id = fields.Many2one('stock.multishipping', readonly=True)
    x_product_id = fields.Many2one('product.product', string="Product",
                                   domain=lambda self: self._get_picking_products())
    x_quantity = fields.Float('Quantity')
    x_remaining_stock = fields.Float(string="Remaining Products", compute='_compute_products')
    x_total_stock = fields.Float(string="Total Stock", compute='_compute_products')

    @api.depends('x_product_id')
    def _compute_name(self):
        for record in self:
            record.name = str(record.x_product_id.name) + '/' + str(record.x_multishipping_id.name)

    @api.depends('x_product_id', 'x_quantity')
    def _compute_products(self):
        for record in self:
            total_products = 0
            allocated_products = 0
            for shipment in record.x_multishipping_id:
                for pick in shipment.x_picking_id:
                    for stock_move in pick.move_ids_without_package:
                        if stock_move.product_id.id == record.x_product_id.id:
                            total_products += stock_move.product_uom_qty
                    for multishipping in pick.x_multishipping_id:
                        for line in multishipping.x_product_lines:
                            if line.x_product_id.id == record.x_product_id.id:
                                allocated_products += line.x_quantity

            record.x_remaining_stock = total_products - allocated_products
            record.x_total_stock = total_products


    @api.onchange('x_product_id')
    def _get_picking_products(self):
        for record in self:
            arr = []
            for pick in record.x_multishipping_id.x_picking_id:
                for line in pick.move_ids_without_package:
                    arr.append(line.product_id.id)
            res = {
                'domain': {
                    'x_product_id': [('id', 'in', arr)],
                }
            }
            return res
