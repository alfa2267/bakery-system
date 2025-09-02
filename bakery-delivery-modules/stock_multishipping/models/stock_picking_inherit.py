# -*- coding: utf-8 -*-

from odoo import api, fields, models, SUPERUSER_ID, _


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    x_ship_to_multiple_locations = fields.Boolean(string="Ship To Multiple Locations")
    x_multishipping_id = fields.One2many('stock.multishipping', 'x_picking_id', string="Shipping Locations")