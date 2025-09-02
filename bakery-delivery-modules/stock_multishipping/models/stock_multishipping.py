# -*- coding: utf-8 -*-

from odoo import api, fields, models, SUPERUSER_ID, _
from odoo.exceptions import ValidationError


class StockMultishipping(models.Model):
    _name = 'stock.multishipping'

    name = fields.Char(string="Name", compute='_compute_name')
    x_product_lines = fields.One2many('stock.multishipping.line', 'x_multishipping_id', string="Shipping lines")
    x_picking_id = fields.Many2one('stock.picking', string="stock", readonly=True)
    x_partner_id = fields.Many2one('res.partner', related='x_picking_id.partner_id', string='Customer')
    x_address_id = fields.Many2one('res.partner', string="Shipping Address",
                                   domain=lambda self: self._get_customer_addresses())
    x_origin = fields.Char(string="Order", related='x_picking_id.origin')

    @api.depends('x_picking_id', 'x_address_id')
    def _compute_name(self):
        for record in self:
            record.name = str(record.x_picking_id.name) + '/' + str(record.x_address_id.name)

    @api.onchange('x_address_id')
    def _get_customer_addresses(self):
        for record in self:
            arr = []
            for address in record.x_partner_id.child_ids:
                arr.append(address.id)

            res = {
                'domain': {
                    'x_address_id': [('id', 'in', arr)],
                }
            }
            return res