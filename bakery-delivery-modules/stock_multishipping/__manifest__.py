{
    'name': 'Multishipping Delivery Slip',
    'version': '13.0.0.1',
    'category': 'Generic Modules/Others',
    'description': "Module to assign products to different addressses and create delivery slips",
    'author': 'G.Roumpie',
    'website': '',
    'depends': ['base', 'product', 'stock'],
    'data': [
        'views/stock_picking_inherit.xml',
        'views/stock_multishipping.xml',
        'views/stock_multishipping_line.xml',
        'security/ir.model.access.csv',
        'reports/multishipping_delivery_slip.xml'
    ],
    'images': ['static/description/icon.png'],
    'installable': True,
    'auto_install': False,
    'application': True,
}